from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Models ---

class Step(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    step: str = ""
    owner: str = ""
    planned: str = ""
    actual: str = ""
    status: str = "pending"
    problem: str = ""
    remark: str = ""

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
    launch: str = ""
    alau: str = ""
    pd: Optional[int] = None
    ad: Optional[int] = None
    status: str = "on-track"
    type: str = "NPD"
    tier: str = "Challenger"
    cx: str = "Moderate"
    ui: Optional[int] = None
    ci: Optional[int] = None
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

class StepUpdate(BaseModel):
    status: Optional[str] = None
    actual: Optional[str] = None
    problem: Optional[str] = None
    remark: Optional[str] = None

class RatingUpdate(BaseModel):
    field: str
    value: int

# --- Helpers ---

def serialize_doc(doc):
    if doc and '_id' in doc:
        del doc['_id']
    return doc

# --- Project Endpoints ---

@api_router.get("/projects", response_model=List[ProjectOut])
async def get_projects():
    docs = await db.projects.find({}, {"_id": 0}).to_list(1000)
    return docs

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
        if not phase.get("id"):
            phase["id"] = str(uuid.uuid4())
        for step in phase.get("steps", []):
            if not step.get("id"):
                step["id"] = str(uuid.uuid4())
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
        if not phase.get("id"):
            phase["id"] = str(uuid.uuid4())
        for step in phase.get("steps", []):
            if not step.get("id"):
                step["id"] = str(uuid.uuid4())
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
            if update.status is not None:
                phase["status"] = update.status
            if update.progress is not None:
                phase["progress"] = max(0, min(100, update.progress))
            break
    await db.projects.update_one({"id": project_id}, {"$set": {"phases": phases}})
    return {"status": "updated"}

@api_router.patch("/projects/{project_id}/phases/{phase_id}/steps/{step_id}")
async def update_step(project_id: str, phase_id: str, step_id: str, update: StepUpdate):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    phases = project.get("phases", [])
    for phase in phases:
        if phase["id"] == phase_id:
            for step in phase.get("steps", []):
                if step["id"] == step_id:
                    if update.status is not None:
                        step["status"] = update.status
                    if update.actual is not None:
                        step["actual"] = update.actual
                    if update.problem is not None:
                        step["problem"] = update.problem
                    if update.remark is not None:
                        step["remark"] = update.remark
                    break
            break
    await db.projects.update_one({"id": project_id}, {"$set": {"phases": phases}})
    return {"status": "updated"}

# --- Color Endpoints ---

@api_router.get("/colors", response_model=List[ColorOut])
async def get_colors():
    docs = await db.colors.find({}, {"_id": 0}).to_list(1000)
    return docs

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
    result = []
    for d in docs:
        if "or_rating" in d:
            d["or"] = d.pop("or_rating")
        result.append(d)
    return result

@api_router.post("/manufacturers", response_model=ManufacturerOut)
async def create_manufacturer(mfr: ManufacturerCreate):
    doc = mfr.model_dump(by_alias=True)
    doc["id"] = str(uuid.uuid4())
    # Store as or_rating internally
    if "or" in doc:
        doc["or_rating"] = doc.pop("or")
    await db.manufacturers.insert_one(doc)
    doc.pop("_id", None)
    if "or_rating" in doc:
        doc["or"] = doc.pop("or_rating")
    return doc

@api_router.put("/manufacturers/{mfr_id}", response_model=ManufacturerOut)
async def update_manufacturer(mfr_id: str, mfr: ManufacturerCreate):
    existing = await db.manufacturers.find_one({"id": mfr_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Manufacturer not found")
    doc = mfr.model_dump(by_alias=True)
    if "or" in doc:
        doc["or_rating"] = doc.pop("or")
    await db.manufacturers.update_one({"id": mfr_id}, {"$set": doc})
    doc["id"] = mfr_id
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
    on_track = sum(1 for p in projects if p.get("status") == "on-track")
    at_risk = sum(1 for p in projects if p.get("status") == "at-risk")
    delayed = sum(1 for p in projects if p.get("status") == "delayed")
    completed = sum(1 for p in projects if p.get("status") == "completed")
    return {"total": total, "on_track": on_track, "at_risk": at_risk, "delayed": delayed, "completed": completed}

# --- Seed Data ---

@api_router.post("/seed")
async def seed_data():
    proj_count = await db.projects.count_documents({})
    if proj_count > 0:
        return {"status": "already_seeded", "projects": proj_count}

    sample_projects = [
        {
            "id": str(uuid.uuid4()), "name": "Herbal Body Wash — Neem & Tulsi", "cat": "Personal Care",
            "owner": "Priya S.", "launch": "Apr 15, 2025", "alau": "", "pd": 90, "ad": None,
            "status": "on-track", "type": "NPD", "tier": "Challenger", "cx": "Moderate",
            "ui": 4, "ci": 8, "teams": ["NPD", "R&D", "Design & Creatives", "Supply", "Quality"],
            "pt": "Existing", "pe": "Executable", "pn": "Standard pump bottle, existing mold",
            "notes": "Priority Q2 launch.",
            "phases": [
                {"id": str(uuid.uuid4()), "name": "Product Brief", "team": "NPD", "status": "done", "progress": 100, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Brief given", "owner": "Tanya", "planned": "19th Feb", "actual": "19th Feb", "status": "done", "problem": "", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Feasibility check", "owner": "Sonal", "planned": "25th Feb", "actual": "26th Feb", "status": "done", "problem": "", "remark": ""},
                ]},
                {"id": str(uuid.uuid4()), "name": "R&D Feasibility", "team": "R&D", "status": "in-progress", "progress": 75, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Sample study", "owner": "Sonal", "planned": "16th March", "actual": "16th March", "status": "done", "problem": "", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Sample approval", "owner": "Harshita", "planned": "18th March", "actual": "", "status": "in-progress", "problem": "", "remark": "Formulation nearly final"},
                    {"id": str(uuid.uuid4()), "step": "Internal feedback", "owner": "Sonal", "planned": "20th March", "actual": "", "status": "pending", "problem": "", "remark": ""},
                ]},
                {"id": str(uuid.uuid4()), "name": "Packaging", "team": "Design & Creatives", "status": "in-progress", "progress": 50, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Packaging brief", "owner": "Suruchi", "planned": "19th Feb", "actual": "19th Feb", "status": "done", "problem": "", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Vendor shortlist", "owner": "Neha", "planned": "25th Feb", "actual": "28th Feb", "status": "done", "problem": "", "remark": "3-day lag"},
                    {"id": str(uuid.uuid4()), "step": "Physical approval", "owner": "Suruchi", "planned": "10th March", "actual": "", "status": "in-progress", "problem": "", "remark": ""},
                ]},
                {"id": str(uuid.uuid4()), "name": "Manufacturing Setup", "team": "Supply", "status": "pending", "progress": 0, "steps": [
                    {"id": str(uuid.uuid4()), "step": "FG PO raised", "owner": "Shubham", "planned": "1st April", "actual": "", "status": "pending", "problem": "", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Final QC clearance", "owner": "Sameer", "planned": "10th April", "actual": "", "status": "pending", "problem": "", "remark": ""},
                ]},
            ]
        },
        {
            "id": str(uuid.uuid4()), "name": "SPF 50 Sunscreen — Matte", "cat": "Skincare",
            "owner": "Rahul M.", "launch": "May 2, 2025", "alau": "", "pd": 90, "ad": 120,
            "status": "at-risk", "type": "NPD", "tier": "Disruptor", "cx": "Complex",
            "ui": 7, "ci": 5, "teams": ["NPD", "R&D", "Supply", "Quality"],
            "pt": "New", "pe": "Tough to Execute", "pn": "Airless pump — China sourcing, 8-week lead",
            "notes": "Stability pending. Zinc oxide delayed.",
            "phases": [
                {"id": str(uuid.uuid4()), "name": "Product Brief", "team": "NPD", "status": "done", "progress": 100, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Brief issued", "owner": "Tanya", "planned": "15th Jan", "actual": "15th Jan", "status": "done", "problem": "", "remark": ""}
                ]},
                {"id": str(uuid.uuid4()), "name": "R&D Feasibility", "team": "R&D", "status": "in-progress", "progress": 70, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Formula submitted", "owner": "Sonal", "planned": "1st Feb", "actual": "1st Feb", "status": "done", "problem": "", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Stability test", "owner": "Harshita", "planned": "15th Feb", "actual": "", "status": "in-progress", "problem": "Stability result pending — 2-week risk", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Regulatory review", "owner": "Sonal", "planned": "20th Feb", "actual": "20th Feb", "status": "done", "problem": "", "remark": ""},
                ]},
                {"id": str(uuid.uuid4()), "name": "Procurement", "team": "Supply", "status": "pending", "progress": 30, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Zinc oxide PO", "owner": "Neha", "planned": "1st March", "actual": "", "status": "pending", "problem": "Supplier lead time extended 2 weeks — escalate to alternate", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Other RM procurement", "owner": "Ashish", "planned": "15th March", "actual": "", "status": "pending", "problem": "", "remark": ""},
                ]},
            ]
        },
        {
            "id": str(uuid.uuid4()), "name": "PBS — Personal Body Scrub", "cat": "Personal Care",
            "owner": "Kavita N.", "launch": "1st Feb 2025", "alau": "30th May 2025", "pd": 110, "ad": 229,
            "status": "delayed", "type": "NPD", "tier": "Commoner", "cx": "Simple",
            "ui": 2, "ci": 10, "teams": ["NPD", "R&D", "Design & Creatives", "Supply", "Quality"],
            "pt": "Existing", "pe": "Executable", "pn": "Standard jar, color change only",
            "notes": "119-day slip. Brief delay + color rework.",
            "phases": [
                {"id": str(uuid.uuid4()), "name": "Product Brief", "team": "NPD", "status": "done", "progress": 100, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Brief given", "owner": "Tanya", "planned": "15th Sept", "actual": "9th Oct", "status": "done", "problem": "Volume/MRP not shared at start — 24-day delay", "remark": ""}
                ]},
                {"id": str(uuid.uuid4()), "name": "Packaging", "team": "Design & Creatives", "status": "done", "progress": 100, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Color closure", "owner": "Suruchi", "planned": "30th Oct", "actual": "10th Nov", "status": "done", "problem": "Color changed after masterbatch — 20-day rework", "remark": ""}
                ]},
                {"id": str(uuid.uuid4()), "name": "Manufacturing & Launch", "team": "Supply", "status": "in-progress", "progress": 60, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Production", "owner": "Neel & Ashish", "planned": "15th May", "actual": "", "status": "in-progress", "problem": "", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Warehouse landing", "owner": "Neel & Ashish", "planned": "1st Feb", "actual": "30th May", "status": "done", "problem": "Slipped 119 days", "remark": ""},
                ]},
            ]
        },
        {
            "id": str(uuid.uuid4()), "name": "Diwali Gift Kit 2025", "cat": "Gift",
            "owner": "Suruchi M.", "launch": "Oct 1, 2025", "alau": "", "pd": 60, "ad": None,
            "status": "on-track", "type": "Gift Kit", "tier": "Challenger", "cx": "Simple",
            "ui": 0, "ci": 6, "teams": ["NPD", "Design & Creatives", "Supply"],
            "pt": "New", "pe": "Tough to Execute", "pn": "Custom rigid box with foam insert — new mold",
            "notes": "Hamper with 4 existing SKUs.",
            "phases": [
                {"id": str(uuid.uuid4()), "name": "Kit Brief", "team": "NPD", "status": "done", "progress": 100, "steps": [
                    {"id": str(uuid.uuid4()), "step": "SKU selection", "owner": "Tanya", "planned": "1st July", "actual": "1st July", "status": "done", "problem": "", "remark": ""}
                ]},
                {"id": str(uuid.uuid4()), "name": "Packaging Design", "team": "Design & Creatives", "status": "in-progress", "progress": 40, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Box design brief", "owner": "Suruchi", "planned": "10th July", "actual": "12th July", "status": "done", "problem": "", "remark": "2-day delay"},
                    {"id": str(uuid.uuid4()), "step": "Vendor mold confirmation", "owner": "Neha", "planned": "25th July", "actual": "", "status": "in-progress", "problem": "", "remark": ""},
                ]},
            ]
        },
        {
            "id": str(uuid.uuid4()), "name": "Vitamin C Serum — CPR Reformulation", "cat": "Skincare",
            "owner": "Arjun K.", "launch": "Mar 30, 2025", "alau": "May 15, 2025", "pd": 45, "ad": 76,
            "status": "delayed", "type": "CPR", "tier": "Disruptor", "cx": "Complex",
            "ui": 5, "ci": 3, "teams": ["NPD", "R&D", "Quality"],
            "pt": "Existing", "pe": "Executable", "pn": "Same packaging, label update only",
            "notes": "Stability failed at 40C. Reformulation needed.",
            "phases": [
                {"id": str(uuid.uuid4()), "name": "CPR Brief", "team": "NPD", "status": "done", "progress": 100, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Reformulation brief", "owner": "Tanya", "planned": "15th Jan", "actual": "15th Jan", "status": "done", "problem": "", "remark": ""}
                ]},
                {"id": str(uuid.uuid4()), "name": "R&D Reformulation", "team": "R&D", "status": "done", "progress": 100, "steps": [
                    {"id": str(uuid.uuid4()), "step": "Stability test (failed)", "owner": "Harshita", "planned": "20th Feb", "actual": "20th Feb", "status": "done", "problem": "Failed at 40C/75% RH", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Reformulation complete", "owner": "Sonal", "planned": "28th Feb", "actual": "10th March", "status": "done", "problem": "10-day slip", "remark": ""},
                    {"id": str(uuid.uuid4()), "step": "Re-test & QC", "owner": "Sameer", "planned": "15th March", "actual": "5th April", "status": "done", "problem": "", "remark": ""},
                ]},
            ]
        },
    ]

    sample_colors = [
        {"id": str(uuid.uuid4()), "hex": "#2E7D52", "name": "Forest Green", "proj": "Herbal Body Wash", "notes": "Lid & label"},
        {"id": str(uuid.uuid4()), "hex": "#C8A96E", "name": "Warm Gold", "proj": "Diwali Gift Kit", "notes": "Box ribbon"},
        {"id": str(uuid.uuid4()), "hex": "#F4A261", "name": "Terracotta", "proj": "PBS", "notes": "Base color"},
        {"id": str(uuid.uuid4()), "hex": "#264653", "name": "Deep Teal", "proj": "SPF Sunscreen", "notes": "Tube body"},
        {"id": str(uuid.uuid4()), "hex": "#E9C46A", "name": "Saffron Yellow", "proj": "Vitamin C Serum", "notes": "Label bg"},
    ]

    sample_manufacturers = [
        {"id": str(uuid.uuid4()), "name": "XYZ Cosmetics Pvt Ltd", "loc": "Mumbai", "cat": "Skincare, Haircare", "or_rating": 4, "qr": 3, "pr": 2, "notes": "Good capacity but mid-tier priority for them"},
        {"id": str(uuid.uuid4()), "name": "Green Formulations", "loc": "Pune", "cat": "Herbal, Ayurvedic", "or_rating": 3, "qr": 4, "pr": 5, "notes": "High priority partner — quick turnarounds"},
        {"id": str(uuid.uuid4()), "name": "Packtech Industries", "loc": "Delhi", "cat": "Packaging", "or_rating": 5, "qr": 4, "pr": 3, "notes": "Best packaging output, handles complex molds"},
    ]

    await db.projects.insert_many(sample_projects)
    await db.colors.insert_many(sample_colors)
    await db.manufacturers.insert_many(sample_manufacturers)

    return {"status": "seeded", "projects": len(sample_projects), "colors": len(sample_colors), "manufacturers": len(sample_manufacturers)}

@api_router.get("/")
async def root():
    return {"message": "Launch Control NPD Tracker API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
