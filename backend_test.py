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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)

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
    print("🚀 Starting NPD Tracker API Tests")
    print("=" * 50)
    
    tester = NPDTrackerAPITester()
    
    # Test sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_seed_data,
        tester.test_get_projects,
        tester.test_get_project_detail,
        tester.test_create_project,
        tester.test_update_project,
        tester.test_delete_project,
        tester.test_get_colors,
        tester.test_create_color,
        tester.test_delete_color,
        tester.test_get_manufacturers,
        tester.test_create_manufacturer,
        tester.test_update_manufacturer_rating,
        tester.test_delete_manufacturer,
        tester.test_get_analytics_metrics,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())