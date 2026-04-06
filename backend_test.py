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
    def test_auth_register(self):
        """Test user registration"""
        test_user = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "testpass123",
            "name": "Test User"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        if success:
            print(f"   Registered user: {response.get('email', 'Unknown')}")
            print(f"   User role: {response.get('role', 'Unknown')}")
            # Check if cookies are set
            cookies = self.session.cookies.get_dict()
            if 'access_token' in cookies:
                print(f"   ✅ Access token cookie set")
            if 'refresh_token' in cookies:
                print(f"   ✅ Refresh token cookie set")
        return success

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

    def test_auth_login_invalid(self):
        """Test login with invalid credentials"""
        invalid_creds = {
            "email": "invalid@test.com",
            "password": "wrongpassword"
        }
        
        success, response = self.run_test(
            "Invalid Login (should fail)",
            "POST",
            "auth/login",
            401,
            data=invalid_creds
        )
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

    def test_auth_refresh(self):
        """Test token refresh"""
        success, response = self.run_test(
            "Refresh Token",
            "POST",
            "auth/refresh",
            200
        )
        if success:
            print(f"   Token refreshed successfully")
        return success

    def test_auth_logout(self):
        """Test logout"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        if success:
            print(f"   Logged out successfully")
            # Check if cookies are cleared
            cookies = self.session.cookies.get_dict()
            if 'access_token' not in cookies and 'refresh_token' not in cookies:
                print(f"   ✅ Auth cookies cleared")
        return success

    def test_auth_protected_without_login(self):
        """Test accessing protected endpoint without authentication"""
        # Clear session cookies first
        self.session.cookies.clear()
        
        success, response = self.run_test(
            "Protected Endpoint Without Auth (should fail)",
            "GET",
            "auth/me",
            401
        )
        return success

    # === NPD TEMPLATE TESTS ===
    def test_get_npd_template(self):
        """Test getting NPD template"""
        success, response = self.run_test(
            "Get NPD Template",
            "GET",
            "template/npd",
            200
        )
        if success:
            phases = response.get('phases', [])
            total_steps = sum(len(phase.get('steps', [])) for phase in phases)
            print(f"   Template has {len(phases)} phases")
            print(f"   Template has {total_steps} total steps")
            if len(phases) == 8 and total_steps == 54:
                print(f"   ✅ Correct NPD template structure (8 phases, 54 steps)")
            else:
                print(f"   ⚠️  Expected 8 phases and 54 steps, got {len(phases)} phases and {total_steps} steps")
        return success

    # === STEP UPDATE TESTS ===
    def test_update_step_with_history(self):
        """Test updating step with date history tracking"""
        # First login as admin
        self.test_auth_login_admin()
        
        # Get a project with phases and steps
        if not self.created_ids["projects"]:
            self.test_get_projects()
        
        if not self.created_ids["projects"]:
            print("❌ No project available for step update test")
            return False
        
        project_id = self.created_ids["projects"][0]
        
        # Get project details to find a phase and step
        success, project = self.run_test(
            "Get Project for Step Update",
            "GET",
            f"projects/{project_id}",
            200
        )
        
        if not success or not project.get('phases'):
            print("❌ No phases found in project for step update test")
            return False
        
        phase = project['phases'][0]
        if not phase.get('steps'):
            print("❌ No steps found in phase for step update test")
            return False
        
        step = phase['steps'][0]
        phase_id = phase['id']
        step_id = step['id']
        
        # Update step with new dates
        update_data = {
            "planned": "15th March 2025",
            "actual": "18th March 2025",
            "owner": "Test Owner",
            "changed_by": "Test User"
        }
        
        success, response = self.run_test(
            "Update Step with Date History",
            "PATCH",
            f"projects/{project_id}/phases/{phase_id}/steps/{step_id}",
            200,
            data=update_data
        )
        
        if success:
            # Verify the update by getting the project again
            success2, updated_project = self.run_test(
                "Verify Step Update",
                "GET",
                f"projects/{project_id}",
                200
            )
            
            if success2:
                updated_step = None
                for ph in updated_project.get('phases', []):
                    if ph['id'] == phase_id:
                        for st in ph.get('steps', []):
                            if st['id'] == step_id:
                                updated_step = st
                                break
                        break
                
                if updated_step:
                    print(f"   Updated planned date: {updated_step.get('planned', 'None')}")
                    print(f"   Updated actual date: {updated_step.get('actual', 'None')}")
                    print(f"   Updated owner: {updated_step.get('owner', 'None')}")
                    
                    date_history = updated_step.get('date_history', [])
                    print(f"   Date history entries: {len(date_history)}")
                    
                    if date_history:
                        for entry in date_history:
                            print(f"     - {entry.get('field', 'unknown')} changed from '{entry.get('old_value', '')}' to '{entry.get('new_value', '')}' by {entry.get('changed_by', 'unknown')}")
        
        return success

    # === CSV EXPORT TESTS ===
    def test_csv_export(self):
        """Test CSV export functionality"""
        # First login as admin
        self.test_auth_login_admin()
        
        if not self.created_ids["projects"]:
            self.test_get_projects()
        
        if not self.created_ids["projects"]:
            print("❌ No project available for CSV export test")
            return False
        
        project_id = self.created_ids["projects"][0]
        
        # Test CSV export endpoint
        url = f"{self.base_url}/api/projects/{project_id}/export"
        
        self.tests_run += 1
        print(f"\n🔍 Testing CSV Export...")
        print(f"   URL: {url}")
        
        try:
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check content type
                content_type = response.headers.get('content-type', '')
                if 'text/csv' in content_type:
                    print(f"   ✅ Correct content type: {content_type}")
                else:
                    print(f"   ⚠️  Unexpected content type: {content_type}")
                
                # Check content disposition header
                content_disposition = response.headers.get('content-disposition', '')
                if 'attachment' in content_disposition and '.csv' in content_disposition:
                    print(f"   ✅ Correct content disposition: {content_disposition}")
                else:
                    print(f"   ⚠️  Unexpected content disposition: {content_disposition}")
                
                # Check CSV content
                csv_content = response.text
                lines = csv_content.split('\n')
                print(f"   CSV has {len(lines)} lines")
                
                if len(lines) > 10:  # Should have project info + headers + data
                    print(f"   ✅ CSV appears to have content")
                else:
                    print(f"   ⚠️  CSV seems too short")
                
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

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
                print(f"   Sample project: {response[0]['name']}")
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
            print(f"   Phases: {len(response.get('phases', []))}")
        return success

    def test_create_project(self):
        """Test creating a new project"""
        test_project = {
            "name": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "cat": "Test Category",
            "owner": "Test Owner",
            "launch": "Dec 31, 2025",
            "status": "on-track",
            "type": "NPD",
            "tier": "Challenger",
            "cx": "Moderate",
            "pd": 60,
            "teams": ["NPD", "R&D"],
            "phases": [
                {
                    "name": "Test Phase",
                    "team": "NPD",
                    "status": "pending",
                    "progress": 0,
                    "steps": []
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=test_project
        )
        if success and 'id' in response:
            self.created_ids["projects"].append(response['id'])
            print(f"   Created project: {response['name']}")
        return success

    def test_update_project(self):
        """Test updating a project"""
        if not self.created_ids["projects"]:
            print("❌ No project ID available for update test")
            return False
        
        project_id = self.created_ids["projects"][-1]  # Use last created project
        update_data = {
            "name": f"Updated Test Project {datetime.now().strftime('%H%M%S')}",
            "cat": "Updated Category",
            "owner": "Updated Owner",
            "status": "at-risk",
            "type": "NPD",
            "tier": "Challenger",
            "cx": "Moderate"
        }
        
        success, response = self.run_test(
            "Update Project",
            "PUT",
            f"projects/{project_id}",
            200,
            data=update_data
        )
        return success

    def test_delete_project(self):
        """Test deleting a project"""
        if len(self.created_ids["projects"]) < 2:
            print("❌ No extra project ID available for delete test")
            return False
        
        project_id = self.created_ids["projects"].pop()  # Remove and delete last project
        success, response = self.run_test(
            "Delete Project",
            "DELETE",
            f"projects/{project_id}",
            200
        )
        return success

    def test_get_colors(self):
        """Test getting all colors"""
        success, response = self.run_test(
            "Get All Colors",
            "GET",
            "colors",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} colors")
            if len(response) > 0:
                self.created_ids["colors"].append(response[0]["id"])
                print(f"   Sample color: {response[0]['name']} ({response[0]['hex']})")
        return success

    def test_create_color(self):
        """Test creating a new color"""
        test_color = {
            "hex": "#FF5733",
            "name": f"Test Color {datetime.now().strftime('%H%M%S')}",
            "proj": "Test Project",
            "notes": "Test color notes"
        }
        
        success, response = self.run_test(
            "Create Color",
            "POST",
            "colors",
            200,
            data=test_color
        )
        if success and 'id' in response:
            self.created_ids["colors"].append(response['id'])
            print(f"   Created color: {response['name']}")
        return success

    def test_delete_color(self):
        """Test deleting a color"""
        if len(self.created_ids["colors"]) < 2:
            print("❌ No extra color ID available for delete test")
            return False
        
        color_id = self.created_ids["colors"].pop()  # Remove and delete last color
        success, response = self.run_test(
            "Delete Color",
            "DELETE",
            f"colors/{color_id}",
            200
        )
        return success

    def test_get_manufacturers(self):
        """Test getting all manufacturers"""
        success, response = self.run_test(
            "Get All Manufacturers",
            "GET",
            "manufacturers",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} manufacturers")
            if len(response) > 0:
                self.created_ids["manufacturers"].append(response[0]["id"])
                print(f"   Sample manufacturer: {response[0]['name']}")
        return success

    def test_create_manufacturer(self):
        """Test creating a new manufacturer"""
        test_manufacturer = {
            "name": f"Test Manufacturer {datetime.now().strftime('%H%M%S')}",
            "loc": "Test City",
            "cat": "Test Category",
            "or": 4,
            "qr": 3,
            "pr": 5,
            "notes": "Test manufacturer notes"
        }
        
        success, response = self.run_test(
            "Create Manufacturer",
            "POST",
            "manufacturers",
            200,
            data=test_manufacturer
        )
        if success and 'id' in response:
            self.created_ids["manufacturers"].append(response['id'])
            print(f"   Created manufacturer: {response['name']}")
        return success

    def test_update_manufacturer_rating(self):
        """Test updating manufacturer rating"""
        if not self.created_ids["manufacturers"]:
            print("❌ No manufacturer ID available for rating test")
            return False
        
        manufacturer_id = self.created_ids["manufacturers"][-1]
        rating_update = {
            "field": "qr",
            "value": 5
        }
        
        success, response = self.run_test(
            "Update Manufacturer Rating",
            "PATCH",
            f"manufacturers/{manufacturer_id}/rating",
            200,
            data=rating_update
        )
        return success

    def test_delete_manufacturer(self):
        """Test deleting a manufacturer"""
        if len(self.created_ids["manufacturers"]) < 2:
            print("❌ No extra manufacturer ID available for delete test")
            return False
        
        manufacturer_id = self.created_ids["manufacturers"].pop()
        success, response = self.run_test(
            "Delete Manufacturer",
            "DELETE",
            f"manufacturers/{manufacturer_id}",
            200
        )
        return success

    def test_get_analytics_metrics(self):
        """Test getting analytics metrics"""
        success, response = self.run_test(
            "Get Analytics Metrics",
            "GET",
            "analytics/metrics",
            200
        )
        if success:
            print(f"   Metrics: {response}")
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
    print("🚀 Starting NPD Tracker API Tests (Iteration 2 - Auth & New Features)")
    print("=" * 70)
    
    tester = NPDTrackerAPITester()
    
    # Test sequence - Auth tests first, then existing functionality
    tests = [
        # Basic API tests
        tester.test_root_endpoint,
        tester.test_seed_data,
        
        # Auth tests
        tester.test_auth_register,
        tester.test_auth_login_admin,
        tester.test_auth_login_invalid,
        tester.test_auth_me,
        tester.test_auth_refresh,
        tester.test_auth_logout,
        tester.test_auth_protected_without_login,
        
        # Re-login for protected operations
        tester.test_auth_login_admin,
        
        # NPD Template tests
        tester.test_get_npd_template,
        
        # Project CRUD tests
        tester.test_get_projects,
        tester.test_get_project_detail,
        tester.test_create_project,
        tester.test_update_project,
        
        # Step update with history tracking
        tester.test_update_step_with_history,
        
        # CSV Export test
        tester.test_csv_export,
        
        # Other CRUD tests
        tester.test_get_colors,
        tester.test_create_color,
        tester.test_get_manufacturers,
        tester.test_create_manufacturer,
        tester.test_update_manufacturer_rating,
        tester.test_get_analytics_metrics,
        
        # Cleanup tests
        tester.test_delete_project,
        tester.test_delete_color,
        tester.test_delete_manufacturer,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())