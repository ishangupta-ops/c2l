#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class NPDTrackerTester:
    def __init__(self, base_url="https://innovation-pipeline-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            req_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=req_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=req_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=req_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=req_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@launchcontrol.com", "password": "admin123"}
        )
        if success and 'id' in response:
            print(f"   Logged in as: {response.get('email')} (Role: {response.get('role')})")
            return True
        return False

    def test_seed_data(self):
        """Test seeding data"""
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
        """Test getting projects with iteration 4 fields"""
        success, response = self.run_test(
            "Get Projects",
            "GET",
            "projects",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} projects")
            # Check for iteration 4 fields
            if response:
                project = response[0]
                has_brand = 'brand' in project
                has_pkg_class = 'pkg_class' in project
                print(f"   Brand field present: {has_brand}")
                print(f"   Packaging classification field present: {has_pkg_class}")
                if has_brand and project.get('brand'):
                    print(f"   Sample brand: {project['brand']}")
                if has_pkg_class and project.get('pkg_class'):
                    print(f"   Sample pkg_class: {project['pkg_class']}")
        return success

    def test_npd_template(self):
        """Test NPD template with critical steps only (29 steps in 5 phases)"""
        success, response = self.run_test(
            "NPD Template",
            "GET",
            "template/npd",
            200
        )
        if success and 'phases' in response:
            phases = response['phases']
            total_steps = sum(len(phase.get('steps', [])) for phase in phases)
            critical_steps = sum(len([s for s in phase.get('steps', []) if s.get('critical', False)]) for phase in phases)
            print(f"   Template: {len(phases)} phases, {total_steps} total steps, {critical_steps} critical steps")
            
            # Check if it matches iteration 4 requirements (29 steps in 5 phases)
            if len(phases) == 5 and total_steps == 29:
                print(f"   ✅ Matches iteration 4 requirements: 5 phases, 29 critical steps")
            else:
                print(f"   ⚠️  Expected 5 phases with 29 steps, got {len(phases)} phases with {total_steps} steps")
        return success

    def test_create_project_with_iteration4_fields(self):
        """Test creating project with iteration 4 fields"""
        project_data = {
            "name": "Test Project Iteration 4",
            "cat": "Skincare",
            "owner": "Test Owner",
            "brand": "Hyphen",  # Iteration 4 brand field
            "launch": "2025-06-01",
            "status": "on-track",
            "type": "NPD",
            "tier": "Challenger",
            "rd_class": "Complex - Innovation",
            "biz_class": "Focus - Core",
            "pkg_class": "Complex - Innovation - China Sourced",  # Iteration 4 packaging classification
            "teams": ["NPD", "R&D"],
            "notes": "Test project for iteration 4",
            "phases": []
        }
        
        success, response = self.run_test(
            "Create Project with Iteration 4 Fields",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            print(f"   Created project ID: {response['id']}")
            print(f"   Brand: {response.get('brand')}")
            print(f"   Packaging Class: {response.get('pkg_class')}")
            return response['id']
        return None

    def test_analytics_metrics(self):
        """Test analytics metrics endpoint"""
        success, response = self.run_test(
            "Analytics Metrics",
            "GET",
            "analytics/metrics",
            200
        )
        if success:
            print(f"   Metrics: {response}")
        return success

def main():
    print("🚀 NPD Tracker Iteration 4 Backend Testing")
    print("=" * 50)
    
    tester = NPDTrackerTester()
    
    # Test sequence
    tests = [
        ("Login", tester.test_login),
        ("Seed Data", tester.test_seed_data),
        ("Get Projects", tester.test_get_projects),
        ("NPD Template", tester.test_npd_template),
        ("Create Project with Iteration 4 Fields", tester.test_create_project_with_iteration4_fields),
        ("Analytics Metrics", tester.test_analytics_metrics),
    ]
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                print(f"\n❌ {test_name} failed - stopping tests")
                break
        except Exception as e:
            print(f"\n❌ {test_name} failed with exception: {e}")
            break
    
    # Print results
    print(f"\n📊 Backend Test Results")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())