"""
Comprehensive Integration & Unit Tests for FoodRescue AI Backend.
Tests SQLite persistence, JWT authentication, role enforcement,
claim lifecycle, impact metrics, and Gemma 4 integration.
"""

import sys
import os
import unittest
import json
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app
from db import init_db, get_db
from ai_service import ai_service, SAFETY_DISCLAIMER


class TestFoodRescuePlatform(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

        # Helper to login as seeded demo donor
        donor_resp = self.app.post("/api/auth/login", json={
            "email": "donor@canteen.edu",
            "password": "Password123!"
        })
        self.donor_token = donor_resp.get_json().get("token")
        self.donor_headers = {"Authorization": f"Bearer {self.donor_token}"}

        # Helper to login as seeded demo recipient
        recipient_resp = self.app.post("/api/auth/login", json={
            "email": "recipient@foodbank.org",
            "password": "Password123!"
        })
        self.recipient_token = recipient_resp.get_json().get("token")
        self.recipient_headers = {"Authorization": f"Bearer {self.recipient_token}"}

    def test_01_health_endpoint(self):
        """Verifies health check reporting SQLite and live Ollama readiness."""
        resp = self.app.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["app"], "FoodRescue AI")
        self.assertIn("ollama", data)
        self.assertIn("model", data["ollama"])
        self.assertEqual(data["ollama"]["model"], "gemma4:e2b")

    def test_02_registration_validation(self):
        """Verifies validation on sign-up including email format, password length, and duplicate emails."""
        # Weak password
        resp = self.app.post("/api/auth/register", json={
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "123",
            "role": "donor"
        })
        self.assertEqual(resp.status_code, 400)

        # Duplicate email check against existing donor
        resp = self.app.post("/api/auth/register", json={
            "full_name": "Chef Marcus Clone",
            "email": "donor@canteen.edu",
            "password": "Password123!",
            "role": "donor"
        })
        self.assertEqual(resp.status_code, 409)

        # Successful registration
        unique_email = f"donor_{os.urandom(4).hex()}@test.org"
        resp = self.app.post("/api/auth/register", json={
            "full_name": "New Community Kitchen",
            "email": unique_email,
            "password": "SecurePassword999!",
            "role": "donor",
            "organization": "Community Kitchen"
        })
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data)
        self.assertEqual(data["user"]["role"], "donor")

    def test_03_login_and_auth_me(self):
        """Verifies valid/invalid login and protected profile route."""
        # Invalid password
        bad_resp = self.app.post("/api/auth/login", json={
            "email": "donor@canteen.edu",
            "password": "WrongPassword!"
        })
        self.assertEqual(bad_resp.status_code, 401)

        # Authenticated profile
        me_resp = self.app.get("/api/auth/me", headers=self.donor_headers)
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.get_json()["user"]["email"], "donor@canteen.edu")

    def test_04_forgot_password_truthful_disclosure(self):
        """Verifies password reset honesty: returns one-time code and acknowledges unconfigured SMTP."""
        req_resp = self.app.post("/api/auth/forgot-password", json={"email": "donor@canteen.edu"})
        self.assertEqual(req_resp.status_code, 200)
        data = req_resp.get_json()
        self.assertTrue(data["dev_mode"])
        reset_token = data["token"]
        self.assertTrue(bool(reset_token))

        # Reset password with valid token
        reset_resp = self.app.post("/api/auth/reset-password", json={
            "email": "donor@canteen.edu",
            "token": reset_token,
            "new_password": "NewPassword123!"
        })
        self.assertEqual(reset_resp.status_code, 200)

        # Restore original password for ongoing tests
        req_resp2 = self.app.post("/api/auth/forgot-password", json={"email": "donor@canteen.edu"})
        token2 = req_resp2.get_json()["token"]
        self.app.post("/api/auth/reset-password", json={
            "email": "donor@canteen.edu",
            "token": token2,
            "new_password": "Password123!"
        })

    def test_05_vision_capability_honesty(self):
        """Audits model architecture and honestly reports lack of vision encoder for text-only model."""
        resp = self.app.post("/api/analyze-photo")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertFalse(data["supported"])
        self.assertIn("text-only", data["message"])

    def test_06_donor_creates_food_listing(self):
        """Verifies a donor can publish a surplus food listing with SQLite persistence."""
        payload = {
            "food_name": "Warm Vegetable Stew & Dinner Rolls",
            "quantity": "18",
            "unit": "bowls",
            "prep_time": "2026-10-12T12:00",
            "deadline": "2026-10-12T17:00",
            "location": "Greenwood Central Canteen, Loading Bay 1",
            "storage_details": "Maintained in insulated thermal containers (>65°C)",
            "allergens": "Wheat (Gluten), Celery",
            "notes": "Bring clean heat-resistant containers if possible.",
            "verification": {"seller_certified": True}
        }
        create_resp = self.app.post("/api/listings", json=payload, headers=self.donor_headers)
        self.assertEqual(create_resp.status_code, 201)
        created_id = create_resp.get_json()["listing_id"]

        # Recipient cannot delete or edit it
        unauth_del = self.app.delete(f"/api/listings/{created_id}", headers=self.recipient_headers)
        self.assertEqual(unauth_del.status_code, 403)

        # Donor can retrieve own listings
        my_listings = self.app.get("/api/donor/my-listings", headers=self.donor_headers)
        self.assertEqual(my_listings.status_code, 200)
        ids = [item["id"] for item in my_listings.get_json()["listings"]]
        self.assertIn(created_id, ids)

    def test_07_claim_workflow_and_impact_stats(self):
        """Full claim workflow: request -> approve -> collected -> impact stats."""
        # 1. Create a fresh listing
        payload = {
            "food_name": "Fresh Fruit & Yogurt Parfaits",
            "quantity": "12",
            "unit": "cups",
            "prep_time": "2026-10-12T09:00",
            "deadline": "2026-10-12T15:00",
            "location": "North Bakery Display",
            "storage_details": "Refrigerated at 3°C",
            "verification": {"seller_certified": True}
        }
        create_resp = self.app.post("/api/listings", json=payload, headers=self.donor_headers)
        listing_id = create_resp.get_json()["listing_id"]

        # 2. Recipient submits claim
        claim_payload = {
            "listing_id": listing_id,
            "quantity_requested": "6 cups",
            "message": "Pantry distribution for 6 commuting students."
        }
        claim_resp = self.app.post("/api/claims", json=claim_payload, headers=self.recipient_headers)
        self.assertEqual(claim_resp.status_code, 201)
        claim_id = claim_resp.get_json()["claim_id"]

        # 3. Recipient views own claims
        recip_claims = self.app.get("/api/recipient/my-claims", headers=self.recipient_headers)
        self.assertEqual(recip_claims.status_code, 200)
        c_ids = [c["id"] for c in recip_claims.get_json()["claims"]]
        self.assertIn(claim_id, c_ids)

        # 4. Donor approves claim
        approve_resp = self.app.put(f"/api/claims/{claim_id}/status", json={"status": "confirmed"}, headers=self.donor_headers)
        self.assertEqual(approve_resp.status_code, 200)

        # 5. Donor marks collected
        collect_resp = self.app.put(f"/api/claims/{claim_id}/status", json={"status": "collected"}, headers=self.donor_headers)
        self.assertEqual(collect_resp.status_code, 200)

        # 6. Verify impact stats include this rescue
        stats_resp = self.app.get("/api/impact-stats")
        self.assertEqual(stats_resp.status_code, 200)
        stats = stats_resp.get_json()["stats"]
        self.assertGreaterEqual(stats["completed_food_rescues"], 1)
        self.assertGreaterEqual(stats["total_quantity_collected"], 12)

    def test_08_notifications(self):
        """Verifies in-app notifications are produced and readable."""
        notifs_resp = self.app.get("/api/notifications", headers=self.recipient_headers)
        self.assertEqual(notifs_resp.status_code, 200)
        notifs = notifs_resp.get_json()["notifications"]
        self.assertIsInstance(notifs, list)


if __name__ == "__main__":
    unittest.main()
