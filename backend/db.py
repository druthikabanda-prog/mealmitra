"""
SQLite Database Layer for FoodRescue AI.
Handles persistent schema initialization, connection management, and safe seeding.
"""

import os
import sqlite3
import uuid
import json
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), "foodrescue.db")


def get_db():
    """Returns a SQLite connection with Row factory enabled and concurrency settings."""
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn


def init_db():
    """Initializes database tables if they do not exist, and safely seeds initial demo records."""
    conn = get_db()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            organization TEXT,
            phone TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS listings (
            id TEXT PRIMARY KEY,
            donor_id TEXT NOT NULL,
            food_name TEXT NOT NULL,
            quantity TEXT NOT NULL,
            unit TEXT NOT NULL,
            prep_time TEXT NOT NULL,
            deadline TEXT NOT NULL,
            location TEXT NOT NULL,
            storage_details TEXT NOT NULL,
            allergens TEXT,
            notes TEXT,
            photo_url TEXT,
            status TEXT NOT NULL DEFAULT 'available',
            ai_insights_json TEXT,
            shareable_message TEXT,
            verification_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (donor_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS claims (
            id TEXT PRIMARY KEY,
            listing_id TEXT NOT NULL,
            recipient_id TEXT NOT NULL,
            quantity_requested TEXT NOT NULL,
            message TEXT,
            status TEXT NOT NULL DEFAULT 'requested',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE,
            FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS password_resets (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            token TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER NOT NULL DEFAULT 0
        );
        """)

    # Seed demo users & listings only if database is brand new
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS count FROM users")
    if cursor.fetchone()["count"] == 0:
        seed_demo_data(conn)

    conn.close()


def seed_demo_data(conn):
    """Inserts initial demo accounts and verified Greenwood Canteen food items."""
    now = datetime.now(timezone.utc).isoformat()
    donor_id = "user-donor-01"
    recipient_id = "user-recipient-01"

    demo_donor_pwd = generate_password_hash("Password123!")
    demo_recipient_pwd = generate_password_hash("Password123!")

    with conn:
        # 1. Insert Donor user
        conn.execute("""
            INSERT INTO users (id, email, password_hash, full_name, role, organization, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            donor_id,
            "donor@canteen.edu",
            demo_donor_pwd,
            "Chef Marcus",
            "donor",
            "Greenwood Campus Central Canteen",
            "+1 555-019-4821",
            now
        ))

        # 2. Insert Recipient user
        conn.execute("""
            INSERT INTO users (id, email, password_hash, full_name, role, organization, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            recipient_id,
            "recipient@foodbank.org",
            demo_recipient_pwd,
            "Sarah Jenkins",
            "recipient",
            "North Campus Student Food Bank & Pantry",
            "+1 555-019-8833",
            now
        ))

        # 3. Seed Canteen Listing 1
        listing_1_ai = json.dumps({
            "title": "Vegetable Pulao & Spiced Dal Lunch Boxes",
            "summary": "24 freshly packed vegetable pulao meal boxes with seasoned dal.",
            "tags": ["Hot Meal", "Vegetarian", "Prepared Today"],
            "suggested_handling": "Maintain hot food chain (>60°C) or consume/chill within 2 hours.",
            "missing_details_checklist": [],
            "model": "gemma4:e2b",
            "source": "ollama_gemma4"
        })
        listing_1_verif = json.dumps({
            "temperature_checked": True,
            "clean_packaging": True,
            "allergens_declared": True,
            "seller_certified": True
        })
        listing_1_msg = (
            "🚨 *SURPLUS FOOD RESCUE ALERT* 🚨\n\n"
            "🍱 *Food:* Vegetable Pulao & Spiced Dal Lunch Boxes\n"
            "📦 *Quantity:* 24 boxes\n"
            "⏰ *Prepared:* Today 11:00 AM\n"
            "⏳ *Pickup Deadline:* Today 2:30 PM\n"
            "📍 *Location:* Greenwood Campus Central Canteen - Loading Dock B\n"
            "❄️ *Storage:* Insulated thermal warmer (>60°C). Sealed tamper-evident boxes.\n"
            "⚠️ *Allergens:* Contains soy and cumin; gluten-free.\n"
            "📞 *Contact:* Chef Marcus (555-019-4821)\n\n"
            "✅ *Verification:* Verified by donor operator.\n"
            "⚠️ *Notice:* FoodRescue AI coordinates surplus details; receiver inspects upon pickup."
        )

        conn.execute("""
            INSERT INTO listings (
                id, donor_id, food_name, quantity, unit, prep_time, deadline, location,
                storage_details, allergens, notes, photo_url, status, ai_insights_json,
                shareable_message, verification_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "canteen-sample-01",
            donor_id,
            "Vegetable Pulao & Spiced Dal Lunch Boxes",
            "24",
            "boxes",
            "2026-10-12T11:00",
            "2026-10-12T14:30",
            "Greenwood Campus Central Canteen - Loading Dock B",
            "Insulated thermal warmer (>60°C). Sealed recyclable containers.",
            "Contains soy and cumin; gluten-free.",
            "Cooked fresh during lunch rush. Excess unserved portions.",
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
            "available",
            listing_1_ai,
            listing_1_msg,
            listing_1_verif,
            now,
            now
        ))

        # 4. Seed Canteen Listing 2
        listing_2_ai = json.dumps({
            "title": "Fresh Bakery Bagels & Blueberry Muffins",
            "summary": "18 pieces of morning assorted baked goods in parchment packaging.",
            "tags": ["Bakery", "Breakfast Goods", "Ambient Storage"],
            "suggested_handling": "Keep covered in dry room conditions. Best consumed within 24 hours.",
            "missing_details_checklist": [],
            "model": "gemma4:e2b",
            "source": "ollama_gemma4"
        })
        listing_2_verif = json.dumps({
            "temperature_checked": True,
            "clean_packaging": True,
            "allergens_declared": True,
            "seller_certified": True
        })
        listing_2_msg = (
            "🚨 *SURPLUS FOOD RESCUE ALERT* 🚨\n\n"
            "🥐 *Food:* Fresh Bakery Bagels & Blueberry Muffins\n"
            "📦 *Quantity:* 18 assorted pieces\n"
            "⏰ *Prepared:* Today 07:30 AM\n"
            "⏳ *Pickup Deadline:* Today 5:00 PM\n"
            "📍 *Location:* Greenwood Student Union - North Quad Bakery Kiosk\n"
            "❄️ *Storage:* Ambient clean room temp. Individually wrapped.\n"
            "⚠️ *Allergens:* Contains wheat, dairy, eggs. Nut-free.\n"
            "📞 *Contact:* Elena Vance (555-019-4830)\n\n"
            "✅ *Verification:* Verified by donor operator.\n"
            "⚠️ *Notice:* FoodRescue AI coordinates surplus details; receiver inspects upon pickup."
        )

        conn.execute("""
            INSERT INTO listings (
                id, donor_id, food_name, quantity, unit, prep_time, deadline, location,
                storage_details, allergens, notes, photo_url, status, ai_insights_json,
                shareable_message, verification_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "canteen-sample-02",
            donor_id,
            "Fresh Bakery Bagels & Blueberry Muffins",
            "18",
            "assorted pieces",
            "2026-10-12T07:30",
            "2026-10-12T17:00",
            "Greenwood Student Union - North Quad Bakery Kiosk",
            "Ambient clean room temperature. Individually wrapped in wax paper.",
            "Contains wheat, dairy, eggs. Nut-free.",
            "Baked fresh this morning, unsold excess.",
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
            "available",
            listing_2_ai,
            listing_2_msg,
            listing_2_verif,
            now,
            now
        ))

        # 5. Add initial notification for recipient
        conn.execute("""
            INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()),
            recipient_id,
            "Welcome to FoodRescue AI",
            "Your food recipient account is active. Browse Available Food to request fresh surplus.",
            "system",
            0,
            now
        ))
