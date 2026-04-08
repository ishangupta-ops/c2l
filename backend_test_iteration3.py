import requests
import sys
import json
from datetime import datetime

class NPDTrackerAPITester:
    def __init__(self, base_url="https://innovation-pipeline-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {"projects": [], "colors": [], "manufacturers": []}
        self.session = requests.Session()  # For cookie management
        self.auth_token = None
        self.user_data = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_session=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            # Use session for cookie management or regular requests
            client = self.session if use_session else requests
            
            if method == 'GET':
                response = client.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = client.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = client.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = client.delete(url, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = client.patch(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Response ID: {response_data['id']}")
                    elif isinstance(response_data, list) and len(response_data) > 0:
                        print(f"   Response count: {len(response_data)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    # === AUTH TESTS ===
    def test_auth_login_admin(self):
        """Test admin login with correct credentials"""
        admin_creds = {
            "email": "admin@launchcontrol.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_creds
        )
        if success:
            self.user_data = response
            print(f"   Logged in as: {response.get('email', 'Unknown')}")
            print(f"   User role: {response.get('role', 'Unknown')}")
            # Check if cookies are set
            cookies = self.session.cookies.get_dict()
            if 'access_token' in cookies:
                print(f"   ✅ Access token cookie set")
            if 'refresh_token' in cookies:
                print(f"   ✅ Refresh token cookie set")
        return success

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        if success:
            print(f"   Current user: {response.get('email', 'Unknown')}")
            print(f"   User role: {response.get('role', 'Unknown')}")
        return success

    # === NPD TEMPLATE TESTS ===
    def test_get_npd_template(self):
        """Test getting NPD template with critical step flags"""
        success, response = self.run_test(
            "Get NPD Template",
            "GET",
            "template/npd",
            200
        )
        if success:
            phases = response.get('phases', [])
            total_steps = 0
            critical_steps = 0
            
            for phase in phases:
                steps = phase.get('steps', [])
                total_steps += len(steps)
                for step in steps:
                    if step.get('critical', False):
                        critical_steps += 1
            
            print(f"   Template has {len(phases)} phases")
            print(f"   Template has {total_steps} total steps")
            print(f"   Template has {critical_steps} critical steps")
            
            if len(phases) == 8 and total_steps == 54:
                print(f"   ✅ Correct NPD template structure (8 phases, 54 steps)")
            else:
                print(f"   ⚠️  Expected 8 phases and 54 steps, got {len(phases)} phases and {total_steps} steps")
                
            if critical_steps > 0:
                print(f"   ✅ Critical step flags are present")
            else:
                print(f"   ⚠️  No critical steps found in template")
        return success

    # === PROJECT TESTS ===
    def test_get_projects(self):
        """Test getting all projects"""
        success, response = self.run_test(
            "Get All Projects",
            "GET",
            "projects",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} projects")
            if len(response) > 0:
                # Store first project ID for detail testing
                self.created_ids["projects"].append(response[0]["id"])
                project = response[0]
                print(f"   Sample project: {project['name']}")
                print(f"   R&D Classification: {project.get('rd_class', 'Not set')}")
                print(f"   Business Classification: {project.get('biz_class', 'Not set')}")
        return success

    def test_get_project_detail(self):
        """Test getting a specific project"""
        if not self.created_ids["projects"]:
            print("❌ No project ID available for detail test")
            return False
        
        project_id = self.created_ids["projects"][0]
        success, response = self.run_test(
            "Get Project Detail",
            "GET",
            f"projects/{project_id}",
            200
        )
        if success:
            print(f"   Project: {response.get('name', 'Unknown')}")
            print(f"   Status: {response.get('status', 'Unknown')}")
            print(f"   R&D Classification: {response.get('rd_class', 'Not set')}")
            print(f"   Business Classification: {response.get('biz_class', 'Not set')}")
            print(f"   Phases: {len(response.get('phases', []))}")
            
            # Check for critical steps
            critical_count = 0
            for phase in response.get('phases', []):
                for step in phase.get('steps', []):
                    if step.get('critical', False):
                        critical_count += 1
            print(f"   Critical steps: {critical_count}")
        return success

    def test_create_project_with_new_fields(self):
        """Test creating a new project with iteration 3 fields"""
        test_project = {
            "name": f"Test Project Iteration 3 - {datetime.now().strftime('%H%M%S')}",
            "cat": "Test Category",
            "owner": "Test Owner",
            "launch": "2025-12-31",
            "status": "on-track",
            "type": "NPD",
            "tier": "Challenger",
            "rd_class": "Complex - Innovation",  # New R&D Classification
            "biz_class": "Focus - Core",         # New Business Classification
            "pd": 60,
            "teams": ["NPD", "R&D"],
            "phases": [
                {
                    "name": "Test Phase",
                    "team": "NPD",
                    "status": "pending",
                    "progress": 0,
                    "steps": [
                        {
                            "step": "Test Critical Step",
                            "owner": "Test Owner",
                            "planned": "2025-03-15",
                            "actual": "",
                            "status": "pending",
                            "problem": "",
                            "remark": "",
                            "critical": True,  # Test critical step flag
                            "date_history": []
                        },
                        {
                            "step": "Test Non-Critical Step",
                            "owner": "Test Owner",
                            "planned": "2025-03-20",
                            "actual": "",
                            "status": "pending",
                            "problem": "",
                            "remark": "",
                            "critical": False,  # Test non-critical step flag
                            "date_history": []
                        }
                    ]
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Project with Iteration 3 Fields",
            "POST",
            "projects",
            200,
            data=test_project
        )
        if success and 'id' in response:
            self.created_ids["projects"].append(response['id'])
            print(f"   Created project: {response['name']}")
            print(f"   R&D Classification: {response.get('rd_class', 'Not set')}")
            print(f"   Business Classification: {response.get('biz_class', 'Not set')}")
            
            # Check if critical step flags are preserved
            phases = response.get('phases', [])
            if phases and phases[0].get('steps'):
                critical_steps = [s for s in phases[0]['steps'] if s.get('critical', False)]
                non_critical_steps = [s for s in phases[0]['steps'] if not s.get('critical', False)]
                print(f"   Critical steps preserved: {len(critical_steps)}")
                print(f"   Non-critical steps preserved: {len(non_critical_steps)}")
        return success

    def test_update_project_classifications(self):
        """Test updating project with different R&D and Business classifications"""
        if not self.created_ids["projects"]:
            print("❌ No project ID available for update test")
            return False
        
        project_id = self.created_ids["projects"][-1]  # Use last created project
        
        # Test all R&D classifications
        rd_classifications = [
            "Complex - Innovation",
            "Complex - Prototype Tested", 
            "Non Complex - Variation L1",
            "Non Complex - Variation L2",
            "Shop & Deploy"
        ]
        
        # Test all Business classifications
        biz_classifications = [
            "Focus - Core",
            "Portfolio Filler - Growth",
            "Experimental", 
            "Complementary - Support"
        ]
        
        update_data = {
            "name": f"Updated Test Project {datetime.now().strftime('%H%M%S')}",
            "cat": "Updated Category",
            "owner": "Updated Owner",
            "status": "at-risk",
            "type": "NPD",
            "tier": "Challenger",
            "rd_class": rd_classifications[1],  # Different R&D Classification
            "biz_class": biz_classifications[2]  # Different Business Classification
        }
        
        success, response = self.run_test(
            "Update Project Classifications",
            "PUT",
            f"projects/{project_id}",
            200,
            data=update_data
        )
        if success:
            print(f"   Updated R&D Classification: {response.get('rd_class', 'Not set')}")
            print(f"   Updated Business Classification: {response.get('biz_class', 'Not set')}")
            
            # Verify the classifications are valid
            if response.get('rd_class') in rd_classifications:
                print(f"   ✅ R&D Classification is valid")
            else:
                print(f"   ⚠️  R&D Classification may be invalid")
                
            if response.get('biz_class') in biz_classifications:
                print(f"   ✅ Business Classification is valid")
            else:
                print(f"   ⚠️  Business Classification may be invalid")
        return success

    def test_seed_data(self):
        """Test seeding initial data"""
        success, response = self.run_test(
            "Seed Data",
            "POST",
            "seed",
            200
        )
        if success:
            print(f"   Seeded: {response.get('projects', 0)} projects, {response.get('colors', 0)} colors, {response.get('manufacturers', 0)} manufacturers")
        return success

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

def main():
    print("🚀 Starting NPD Tracker API Tests (Iteration 3 - R&D & Business Classifications)")
    print("=" * 80)
    
    tester = NPDTrackerAPITester()
    
    # Test sequence focused on iteration 3 features
    tests = [
        # Basic API tests
        tester.test_root_endpoint,
        tester.test_seed_data,
        
        # Auth tests
        tester.test_auth_login_admin,
        tester.test_auth_me,
        
        # NPD Template tests (critical steps)
        tester.test_get_npd_template,
        
        # Project tests with new classifications
        tester.test_get_projects,
        tester.test_get_project_detail,
        tester.test_create_project_with_new_fields,
        tester.test_update_project_classifications,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 80)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())