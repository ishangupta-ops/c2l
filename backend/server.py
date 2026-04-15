from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os, logging, uuid, secrets, csv, io, bcrypt, jwt
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    return jwt.encode({"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

# --- Auth Models ---
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginInput(BaseModel):
    email: str
    password: str

# --- Auth Endpoints ---
@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.strip().lower()
    if not email or not input.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if len(input.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {"email": email, "password_hash": hash_password(input.password), "name": input.name or email.split("@")[0], "role": "member", "created_at": datetime.now(timezone.utc).isoformat()}
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    at = create_access_token(user_id, email)
    rt = create_refresh_token(user_id)
    set_auth_cookies(response, at, rt)
    return {"id": user_id, "email": email, "name": doc["name"], "role": "member"}

@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    # Brute force check
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc).isoformat() < locked_until:
            raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        # Increment failed attempts
        if attempt:
            new_count = attempt.get("count", 0) + 1
            update = {"$set": {"count": new_count}}
            if new_count >= 5:
                update["$set"]["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            await db.login_attempts.update_one({"identifier": identifier}, update)
        else:
            await db.login_attempts.insert_one({"identifier": identifier, "count": 1})
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Clear attempts on success
    await db.login_attempts.delete_many({"identifier": identifier})
    user_id = str(user["_id"])
    at = create_access_token(user_id, email)
    rt = create_refresh_token(user_id)
    set_auth_cookies(response, at, rt)
    return {"id": user_id, "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "member")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"status": "logged out"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["_id"], "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "member")}

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user_id = str(user["_id"])
        at = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=at, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"status": "refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# --- Data Models ---
class Step(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    step: str = ""
    owner: str = ""
    planned: str = ""
    actual: str = ""
    status: str = "pending"
    problem: str = ""
    remark: str = ""
    critical: bool = False
    date_history: List[dict] = []

class Phase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    team: str = "NPD"
    status: str = "pending"
    progress: int = 0
    steps: List[Step] = []

class ProjectCreate(BaseModel):
    name: str
    cat: str = ""
    owner: str = ""
    brand: str = ""
    launch: str = ""
    alau: str = ""
    pd: Optional[int] = None
    ad: Optional[int] = None
    status: str = "on-track"
    type: str = "NPD"
    tier: str = "Challenger"
    rd_class: str = "Complex - Innovation"
    biz_class: str = "Focus - Core"
    pkg_class: str = ""
    teams: List[str] = []
    pt: str = ""
    pe: str = ""
    pn: str = ""
    notes: str = ""
    phases: List[Phase] = []

class ProjectOut(ProjectCreate):
    id: str

class ColorCreate(BaseModel):
    hex: str
    name: str
    proj: str = ""
    notes: str = ""

class ColorOut(ColorCreate):
    id: str

class ManufacturerCreate(BaseModel):
    name: str
    loc: str = ""
    cat: str = ""
    or_rating: int = Field(0, alias="or")
    qr: int = 0
    pr: int = 0
    notes: str = ""
    class Config:
        populate_by_name = True

class ManufacturerOut(BaseModel):
    id: str
    name: str
    loc: str = ""
    cat: str = ""
    or_rating: int = Field(0, alias="or")
    qr: int = 0
    pr: int = 0
    notes: str = ""
    class Config:
        populate_by_name = True

class PhaseUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None

class StepInlineUpdate(BaseModel):
    planned: Optional[str] = None
    actual: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = None
    problem: Optional[str] = None
    remark: Optional[str] = None
    changed_by: Optional[str] = None

class RatingUpdate(BaseModel):
    field: str
    value: int

# --- Project Endpoints ---
@api_router.get("/projects", response_model=List[ProjectOut])
async def get_projects():
    return await db.projects.find({}, {"_id": 0}).to_list(1000)

@api_router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str):
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return doc

@api_router.post("/projects", response_model=ProjectOut)
async def create_project(project: ProjectCreate):
    doc = project.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    for phase in doc.get("phases", []):
        if not phase.get("id"): phase["id"] = str(uuid.uuid4())
        for step in phase.get("steps", []):
            if not step.get("id"): step["id"] = str(uuid.uuid4())
            if "date_history" not in step: step["date_history"] = []
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/projects/{project_id}", response_model=ProjectOut)
async def update_project(project_id: str, project: ProjectCreate):
    existing = await db.projects.find_one({"id": project_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    doc = project.model_dump()
    for phase in doc.get("phases", []):
        if not phase.get("id"): phase["id"] = str(uuid.uuid4())
        for step in phase.get("steps", []):
            if not step.get("id"): step["id"] = str(uuid.uuid4())
            if "date_history" not in step: step["date_history"] = []
    await db.projects.update_one({"id": project_id}, {"$set": doc})
    doc["id"] = project_id
    return doc

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted"}

@api_router.patch("/projects/{project_id}/phases/{phase_id}")
async def update_phase(project_id: str, phase_id: str, update: PhaseUpdate):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    phases = project.get("phases", [])
    for phase in phases:
        if phase["id"] == phase_id:
            if update.status is not None: phase["status"] = update.status
            if update.progress is not None: phase["progress"] = max(0, min(100, update.progress))
            break
    await db.projects.update_one({"id": project_id}, {"$set": {"phases": phases}})
    return {"status": "updated"}

@api_router.patch("/projects/{project_id}/phases/{phase_id}/steps/{step_id}")
async def update_step(project_id: str, phase_id: str, step_id: str, update: StepInlineUpdate):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    phases = project.get("phases", [])
    for phase in phases:
        if phase["id"] == phase_id:
            for step in phase.get("steps", []):
                if step["id"] == step_id:
                    if "date_history" not in step:
                        step["date_history"] = []
                    now = datetime.now(timezone.utc).isoformat()
                    changed_by = update.changed_by or "Unknown"
                    # Track date changes
                    if update.planned is not None and update.planned != step.get("planned", ""):
                        step["date_history"].append({
                            "field": "planned",
                            "old_value": step.get("planned", ""),
                            "new_value": update.planned,
                            "changed_by": changed_by,
                            "changed_at": now,
                            "revision": len([h for h in step["date_history"] if h.get("field") == "planned"]) + 1,
                        })
                        step["planned"] = update.planned
                    if update.actual is not None and update.actual != step.get("actual", ""):
                        step["date_history"].append({
                            "field": "actual",
                            "old_value": step.get("actual", ""),
                            "new_value": update.actual,
                            "changed_by": changed_by,
                            "changed_at": now,
                            "revision": len([h for h in step["date_history"] if h.get("field") == "actual"]) + 1,
                        })
                        step["actual"] = update.actual
                    if update.owner is not None: step["owner"] = update.owner
                    if update.status is not None: step["status"] = update.status
                    if update.problem is not None: step["problem"] = update.problem
                    if update.remark is not None: step["remark"] = update.remark
                    break
            break
    await db.projects.update_one({"id": project_id}, {"$set": {"phases": phases}})
    return {"status": "updated"}

# --- CSV Export ---
@api_router.get("/projects/{project_id}/export")
async def export_project_csv(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Project", project.get("name", "")])
    writer.writerow(["Category", project.get("cat", ""), "Owner", project.get("owner", ""), "Status", project.get("status", "")])
    writer.writerow(["Target Launch", project.get("launch", ""), "Actual Launch", project.get("alau", "")])
    writer.writerow(["Planned Days", project.get("pd", ""), "Actual Days", project.get("ad", "")])
    writer.writerow(["Type", project.get("type", ""), "Tier", project.get("tier", ""), "Complexity", project.get("cx", "")])
    writer.writerow([])
    writer.writerow(["Phase", "Phase Status", "Phase Progress", "Step", "Owner", "Planned Date", "Actual Date", "Step Status", "Problem", "Remark", "Date Revisions"])
    for phase in project.get("phases", []):
        for step in phase.get("steps", []):
            revisions = len(step.get("date_history", []))
            writer.writerow([
                phase.get("name", ""), phase.get("status", ""), f"{phase.get('progress', 0)}%",
                step.get("step", ""), step.get("owner", ""),
                step.get("planned", ""), step.get("actual", ""),
                step.get("status", ""), step.get("problem", ""), step.get("remark", ""),
                revisions,
            ])
    # Date History Sheet
    writer.writerow([])
    writer.writerow(["--- DATE CHANGE HISTORY ---"])
    writer.writerow(["Phase", "Step", "Field", "Old Value", "New Value", "Changed By", "Changed At", "Revision #"])
    for phase in project.get("phases", []):
        for step in phase.get("steps", []):
            for h in step.get("date_history", []):
                writer.writerow([
                    phase.get("name", ""), step.get("step", ""),
                    h.get("field", ""), h.get("old_value", ""), h.get("new_value", ""),
                    h.get("changed_by", ""), h.get("changed_at", ""), h.get("revision", ""),
                ])
    content = output.getvalue()
    return Response(content=content, media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{project.get("name", "project")}.csv"'})

# --- Color Endpoints ---
@api_router.get("/colors", response_model=List[ColorOut])
async def get_colors():
    return await db.colors.find({}, {"_id": 0}).to_list(1000)

@api_router.post("/colors", response_model=ColorOut)
async def create_color(color: ColorCreate):
    doc = color.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db.colors.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/colors/{color_id}")
async def delete_color(color_id: str):
    result = await db.colors.delete_one({"id": color_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Color not found")
    return {"status": "deleted"}

# --- Manufacturer Endpoints ---
@api_router.get("/manufacturers", response_model=List[ManufacturerOut])
async def get_manufacturers():
    docs = await db.manufacturers.find({}, {"_id": 0}).to_list(1000)
    for d in docs:
        if "or_rating" in d:
            d["or"] = d.pop("or_rating")
    return docs

@api_router.post("/manufacturers", response_model=ManufacturerOut)
async def create_manufacturer(mfr: ManufacturerCreate):
    doc = mfr.model_dump(by_alias=True)
    doc["id"] = str(uuid.uuid4())
    if "or" in doc:
        doc["or_rating"] = doc.pop("or")
    await db.manufacturers.insert_one(doc)
    doc.pop("_id", None)
    if "or_rating" in doc:
        doc["or"] = doc.pop("or_rating")
    return doc

@api_router.patch("/manufacturers/{mfr_id}/rating")
async def update_manufacturer_rating(mfr_id: str, update: RatingUpdate):
    existing = await db.manufacturers.find_one({"id": mfr_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    field_map = {"or": "or_rating", "qr": "qr", "pr": "pr"}
    db_field = field_map.get(update.field, update.field)
    await db.manufacturers.update_one({"id": mfr_id}, {"$set": {db_field: update.value}})
    return {"status": "updated"}

@api_router.delete("/manufacturers/{mfr_id}")
async def delete_manufacturer(mfr_id: str):
    result = await db.manufacturers.delete_one({"id": mfr_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    return {"status": "deleted"}

# --- Analytics ---
@api_router.get("/analytics/metrics")
async def get_metrics():
    projects = await db.projects.find({}, {"_id": 0, "status": 1}).to_list(1000)
    total = len(projects)
    return {
        "total": total,
        "on_track": sum(1 for p in projects if p.get("status") == "on-track"),
        "at_risk": sum(1 for p in projects if p.get("status") == "at-risk"),
        "delayed": sum(1 for p in projects if p.get("status") == "delayed"),
        "completed": sum(1 for p in projects if p.get("status") == "completed"),
    }

# --- NPD Template ---
@api_router.get("/template/npd")
async def get_npd_template():
    return {"phases": NPD_TEMPLATE_PHASES}

NPD_TEMPLATE_PHASES = [
    {"id": "", "name": "Product Brief & Feasibility", "team": "NPD", "status": "pending", "progress": 0, "steps": [
        {"id": "", "step": "Product brief given", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Feasibility check of the product", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "R&D samples approval", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Feedback run through - internal", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Feedback run through - external", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Claims Results", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Base approval", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Manufacturer finalization", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Product Approval", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Preliminary Stability Initiated", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "1 Month Stability Confirmation", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
    ]},
    {"id": "", "name": "Packaging & Color", "team": "Supply", "status": "pending", "progress": 0, "steps": [
        {"id": "", "step": "Packaging brief closure", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Packaging options - Vendors", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Physical Packaging Approval", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Color input given", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Final Packaging check - colour chips", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Masterbatch", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Color Closure", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
    ]},
    {"id": "", "name": "Final Approvals & Formulation", "team": "NPD", "status": "pending", "progress": 0, "steps": [
        {"id": "", "step": "Final Product Approval - By Team", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Formulation closure", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Fact Sheet with Ingredients / Pitch Sheet", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
    ]},
    {"id": "", "name": "Manufacturing Setup", "team": "Supply", "status": "pending", "progress": 0, "steps": [
        {"id": "", "step": "Master Batch Order", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "FG PO", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Design approval from Manufacturer", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Final QC Clearance - Pack", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
    ]},
    {"id": "", "name": "Conversion & Launch", "team": "Supply", "status": "pending", "progress": 0, "steps": [
        {"id": "", "step": "Commercial dispatch", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "RM/PM Delivery", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Production", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
        {"id": "", "step": "Warehouse Landing", "owner": "", "planned": "", "actual": "", "status": "pending", "problem": "", "remark": "", "critical": True, "date_history": []},
    ]},
]

# --- Seed ---
@api_router.post("/seed")
async def seed_data():
    proj_count = await db.projects.count_documents({})
    if proj_count > 0:
        return {"status": "already_seeded", "projects": proj_count}
    sample_projects = [
        {"id": str(uuid.uuid4()), "name": "Herbal Body Wash — Neem & Tulsi", "cat": "Personal Care", "owner": "Priya S.", "brand": "mCaffeine", "launch": "2025-04-15", "alau": "", "pd": 90, "ad": None, "status": "on-track", "type": "NPD", "tier": "Challenger", "rd_class": "Non Complex - Variation L1", "biz_class": "Focus - Core", "pkg_class": "Non Complex - Variation to established", "teams": ["NPD", "R&D", "Design & Creatives", "Supply", "Quality"], "pt": "Existing", "pe": "Executable", "pn": "Standard pump bottle, existing mold", "notes": "Priority Q2 launch.",
         "phases": [
            {"id": str(uuid.uuid4()), "name": "Product Brief", "team": "NPD", "status": "done", "progress": 100, "steps": [
                {"id": str(uuid.uuid4()), "step": "Product brief given", "owner": "Tanya", "planned": "19th Feb", "actual": "19th Feb", "status": "done", "problem": "", "remark": "", "date_history": []},
                {"id": str(uuid.uuid4()), "step": "Feasibility check", "owner": "Sonal", "planned": "25th Feb", "actual": "26th Feb", "status": "done", "problem": "", "remark": "", "date_history": []},
            ]},
            {"id": str(uuid.uuid4()), "name": "R&D Feasibility", "team": "R&D", "status": "in-progress", "progress": 75, "steps": [
                {"id": str(uuid.uuid4()), "step": "Sample study", "owner": "Sonal", "planned": "16th March", "actual": "16th March", "status": "done", "problem": "", "remark": "", "date_history": []},
                {"id": str(uuid.uuid4()), "step": "Sample approval", "owner": "Harshita", "planned": "18th March", "actual": "", "status": "in-progress", "problem": "", "remark": "Formulation nearly final", "date_history": []},
            ]},
            {"id": str(uuid.uuid4()), "name": "Packaging", "team": "Design & Creatives", "status": "in-progress", "progress": 50, "steps": [
                {"id": str(uuid.uuid4()), "step": "Packaging brief", "owner": "Suruchi", "planned": "19th Feb", "actual": "19th Feb", "status": "done", "problem": "", "remark": "", "date_history": []},
                {"id": str(uuid.uuid4()), "step": "Vendor shortlist", "owner": "Neha", "planned": "25th Feb", "actual": "28th Feb", "status": "done", "problem": "", "remark": "3-day lag", "date_history": []},
            ]},
        ]},
        {"id": str(uuid.uuid4()), "name": "SPF 50 Sunscreen — Matte", "cat": "Skincare", "owner": "Rahul M.", "brand": "Hyphen", "launch": "2025-05-02", "alau": "", "pd": 90, "ad": 120, "status": "at-risk", "type": "NPD", "tier": "Disruptor", "rd_class": "Complex - Innovation", "biz_class": "Focus - Core", "pkg_class": "Complex - Innovation - China Sourced", "teams": ["NPD", "R&D", "Supply", "Quality"], "pt": "New", "pe": "Tough to Execute", "pn": "Airless pump — China sourcing", "notes": "Stability pending.",
         "phases": [
            {"id": str(uuid.uuid4()), "name": "Product Brief", "team": "NPD", "status": "done", "progress": 100, "steps": [
                {"id": str(uuid.uuid4()), "step": "Brief issued", "owner": "Tanya", "planned": "15th Jan", "actual": "15th Jan", "status": "done", "problem": "", "remark": "", "date_history": []},
            ]},
            {"id": str(uuid.uuid4()), "name": "R&D Feasibility", "team": "R&D", "status": "in-progress", "progress": 70, "steps": [
                {"id": str(uuid.uuid4()), "step": "Stability test", "owner": "Harshita", "planned": "15th Feb", "actual": "", "status": "in-progress", "problem": "Stability result pending — 2-week risk", "remark": "", "date_history": []},
            ]},
        ]},
        {"id": str(uuid.uuid4()), "name": "PBS — Personal Body Scrub", "cat": "Personal Care", "owner": "Kavita N.", "launch": "2025-02-01", "alau": "2025-05-30", "pd": 110, "ad": 229, "status": "delayed", "type": "NPD", "tier": "Commoner", "rd_class": "Shop & Deploy", "biz_class": "Portfolio Filler - Growth", "teams": ["NPD", "R&D", "Design & Creatives", "Supply", "Quality"], "pt": "Existing", "pe": "Executable", "pn": "Standard jar", "notes": "119-day slip.",
         "phases": [
            {"id": str(uuid.uuid4()), "name": "Product Brief", "team": "NPD", "status": "done", "progress": 100, "steps": [
                {"id": str(uuid.uuid4()), "step": "Brief given", "owner": "Tanya", "planned": "15th Sept", "actual": "9th Oct", "status": "done", "problem": "Volume/MRP not shared — 24-day delay", "remark": "", "date_history": []},
            ]},
        ]},
        {"id": str(uuid.uuid4()), "name": "Diwali Gift Kit 2025", "cat": "Gift", "owner": "Suruchi M.", "brand": "Hyphen", "launch": "2025-10-01", "alau": "", "pd": 60, "ad": None, "status": "on-track", "type": "Gift Kit", "tier": "Challenger", "rd_class": "Non Complex - Variation L2", "biz_class": "Complementary - Support", "pkg_class": "Complex - India Sourced - Innovation", "teams": ["NPD", "Design & Creatives", "Supply"], "pt": "New", "pe": "Tough to Execute", "pn": "Custom rigid box with foam insert", "notes": "Hamper with 4 existing SKUs.",
         "phases": [
            {"id": str(uuid.uuid4()), "name": "Kit Brief", "team": "NPD", "status": "done", "progress": 100, "steps": [
                {"id": str(uuid.uuid4()), "step": "SKU selection", "owner": "Tanya", "planned": "1st July", "actual": "1st July", "status": "done", "problem": "", "remark": "", "date_history": []},
            ]},
        ]},
        {"id": str(uuid.uuid4()), "name": "Vitamin C Serum — CPR", "cat": "Skincare", "owner": "Arjun K.", "brand": "Hyphen", "launch": "2025-03-30", "alau": "2025-05-15", "pd": 45, "ad": 76, "status": "delayed", "type": "CPR", "tier": "Disruptor", "rd_class": "Complex - Prototype Tested", "biz_class": "Experimental", "pkg_class": "Complex - Mould - Glass", "teams": ["NPD", "R&D", "Quality"], "pt": "Existing", "pe": "Executable", "pn": "Same packaging, label update only", "notes": "Stability failed at 40C.",
         "phases": [
            {"id": str(uuid.uuid4()), "name": "R&D Reformulation", "team": "R&D", "status": "done", "progress": 100, "steps": [
                {"id": str(uuid.uuid4()), "step": "Stability test (failed)", "owner": "Harshita", "planned": "20th Feb", "actual": "20th Feb", "status": "done", "problem": "Failed at 40C/75% RH", "remark": "", "date_history": []},
                {"id": str(uuid.uuid4()), "step": "Reformulation complete", "owner": "Sonal", "planned": "28th Feb", "actual": "10th March", "status": "done", "problem": "10-day slip", "remark": "", "date_history": []},
            ]},
        ]},
    ]
    sample_colors = [
        {"id": str(uuid.uuid4()), "hex": "#2E7D52", "name": "Forest Green", "proj": "Herbal Body Wash", "notes": "Lid & label"},
        {"id": str(uuid.uuid4()), "hex": "#C8A96E", "name": "Warm Gold", "proj": "Diwali Gift Kit", "notes": "Box ribbon"},
        {"id": str(uuid.uuid4()), "hex": "#F4A261", "name": "Terracotta", "proj": "PBS", "notes": "Base color"},
        {"id": str(uuid.uuid4()), "hex": "#264653", "name": "Deep Teal", "proj": "SPF Sunscreen", "notes": "Tube body"},
        {"id": str(uuid.uuid4()), "hex": "#E9C46A", "name": "Saffron Yellow", "proj": "Vitamin C Serum", "notes": "Label bg"},
    ]
    sample_manufacturers = [
        {"id": str(uuid.uuid4()), "name": "XYZ Cosmetics Pvt Ltd", "loc": "Mumbai", "cat": "Skincare, Haircare", "or_rating": 4, "qr": 3, "pr": 2, "notes": "Good capacity but mid-tier priority"},
        {"id": str(uuid.uuid4()), "name": "Green Formulations", "loc": "Pune", "cat": "Herbal, Ayurvedic", "or_rating": 3, "qr": 4, "pr": 5, "notes": "High priority partner"},
        {"id": str(uuid.uuid4()), "name": "Packtech Industries", "loc": "Delhi", "cat": "Packaging", "or_rating": 5, "qr": 4, "pr": 3, "notes": "Best packaging output"},
    ]
    await db.projects.insert_many(sample_projects)
    await db.colors.insert_many(sample_colors)
    await db.manufacturers.insert_many(sample_manufacturers)
    return {"status": "seeded", "projects": len(sample_projects), "colors": len(sample_colors), "manufacturers": len(sample_manufacturers)}

@api_router.get("/")
async def root():
    return {"message": "Launch Control NPD Tracker API"}

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@launchcontrol.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    # Write test credentials
    creds_path = Path("/app/memory/test_credentials.md")
    creds_path.parent.mkdir(parents=True, exist_ok=True)
    creds_path.write_text(f"# Test Credentials\n\n## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n- POST /api/auth/refresh\n")

@app.on_event("startup")
async def startup():
    await seed_admin()

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
