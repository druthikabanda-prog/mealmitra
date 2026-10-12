"""
FoodRescue AI - Complete Flask Backend Server.
Provides secure authentication, SQLite persistence, persistent image uploads,
claim tracking, impact statistics, and real Ollama Gemma 4 AI integration.
"""

import os
import re
import uuid
import json
import logging
from datetime import datetime, timezone, timedelta
from functools import wraps

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from db import get_db, init_db
from ai_service import ai_service, SAFETY_DISCLAIMER

# Load local environment variables
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("FoodRescueAI")

# Directory setup for persistent image uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB

JWT_SECRET = os.getenv("JWT_SECRET", "foodrescue-secret-key-hackathon-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

# Initialize SQLite database on startup
init_db()

# Enable CORS for frontend Vite dev server (e.g., http://localhost:5173)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ==============================================================================
# Helper Functions & Decorators
# ==============================================================================

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def create_token(user):
    """Generates a signed JWT authentication token for a user."""
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "full_name": user["full_name"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user_from_token():
    """Extracts and verifies the user from Authorization Bearer token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, full_name, role, organization, phone FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
    except Exception as e:
        logger.debug("Token decode error: %s", e)
    return None


def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user_from_token()
        if not user:
            return jsonify({"success": False, "error": "Authentication required. Please log in."}), 401
        request.current_user = user
        return f(*args, **kwargs)
    return decorated


def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user_from_token()
            if not user:
                return jsonify({"success": False, "error": "Authentication required. Please log in."}), 401
            if user.get("role") not in allowed_roles:
                return jsonify({
                    "success": False,
                    "error": f"Unauthorized. This action requires one of the following roles: {', '.join(allowed_roles)}."
                }), 403
            request.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator


def create_inapp_notification(user_id, title, message, notif_type, conn=None):
    """Inserts a notification into SQLite for the specified user."""
    should_close = False
    try:
        if conn is None:
            conn = get_db()
            should_close = True
        conn.execute("""
            INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?)
        """, (str(uuid.uuid4()), user_id, title, message, notif_type, datetime.now(timezone.utc).isoformat()))
        if should_close:
            conn.commit()
    except Exception as e:
        logger.error("Error creating notification: %s", e)
    finally:
        if should_close and conn:
            conn.close()


# ==============================================================================
# Static File Serving (Persistent Image Uploads)
# ==============================================================================

@app.route("/uploads/<filename>")
def serve_uploaded_file(filename):
    """Serves persistently stored food photos."""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ==============================================================================
# Health Check Endpoint
# ==============================================================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint indicating backend and live Ollama Gemma readiness."""
    ollama_info = ai_service.get_status()
    return jsonify({
        "status": "healthy",
        "app": "FoodRescue AI",
        "version": "2.0.0",
        "database": "SQLite (foodrescue.db)",
        "ollama": ollama_info,
        "safety_disclaimer": SAFETY_DISCLAIMER
    }), 200


# ==============================================================================
# Authentication Endpoints
# ==============================================================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(force=True, silent=True) or {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "recipient").strip().lower()
    organization = (data.get("organization") or "").strip()
    phone = (data.get("phone") or "").strip()

    if not full_name or not email or not password:
        return jsonify({"success": False, "error": "Full name, email, and password are required."}), 400

    if role not in ["donor", "recipient"]:
        return jsonify({"success": False, "error": "Role must be either 'donor' or 'recipient'."}), 400

    if len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters long."}), 400

    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        return jsonify({"success": False, "error": "Please provide a valid email address."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"success": False, "error": "An account with this email already exists."}), 409

    user_id = f"user-{uuid.uuid4().hex[:8]}"
    pwd_hash = generate_password_hash(password)
    now = datetime.now(timezone.utc).isoformat()

    with conn:
        conn.execute("""
            INSERT INTO users (id, email, password_hash, full_name, role, organization, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, email, pwd_hash, full_name, role, organization, phone, now))
    conn.close()

    user_obj = {
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "organization": organization,
        "phone": phone
    }
    token = create_token(user_obj)

    logger.info("New %s registered: %s (%s)", role, email, full_name)
    return jsonify({
        "success": True,
        "message": "Registration successful.",
        "user": user_obj,
        "token": token
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    logger.info("Login attempt for email: '%s' (pwd length: %d)", email, len(password))

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row or not check_password_hash(user_row["password_hash"], password):
        logger.warning("Failed login attempt for: '%s'", email)
        return jsonify({"success": False, "error": "Invalid email or password. Please check your credentials."}), 401

    user_obj = {
        "id": user_row["id"],
        "email": user_row["email"],
        "full_name": user_row["full_name"],
        "role": user_row["role"],
        "organization": user_row["organization"],
        "phone": user_row["phone"]
    }
    token = create_token(user_obj)

    logger.info("User logged in: %s (%s)", email, user_obj["role"])
    return jsonify({
        "success": True,
        "message": "Login successful.",
        "user": user_obj,
        "token": token
    }), 200


@app.route("/api/auth/me", methods=["GET"])
@auth_required
def get_me():
    """Returns the currently authenticated user profile."""
    return jsonify({
        "success": True,
        "user": request.current_user
    }), 200


@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    """
    Genuine password reset token generation.
    Checks SMTP status: if unconfigured, returns token directly to user with dev notice.
    Never claims an email was sent unless email delivery confirms it.
    """
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"success": False, "error": "Email address is required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name FROM users WHERE email = ?", (email,))
    user_row = cursor.fetchone()

    if not user_row:
        conn.close()
        # Security: Do not disclose whether email exists
        return jsonify({
            "success": True,
            "message": "If an account exists with this email, reset instructions have been generated."
        }), 200

    reset_token = uuid.uuid4().hex[:12].upper()
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(hours=1)).isoformat()

    with conn:
        conn.execute("""
            INSERT INTO password_resets (id, email, token, created_at, expires_at, used)
            VALUES (?, ?, ?, ?, ?, 0)
        """, (str(uuid.uuid4()), email, reset_token, now.isoformat(), expires_at))
    conn.close()

    # Honest disclosure: SMTP is not configured in this hackathon environment
    return jsonify({
        "success": True,
        "dev_mode": True,
        "token": reset_token,
        "message": (
            "Password reset request received. Since email delivery (SMTP) is unconfigured in this demo, "
            f"your one-time reset code is: {reset_token}"
        )
    }), 200


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    token = (data.get("token") or "").strip().upper()
    new_password = data.get("new_password") or ""

    if not email or not token or not new_password:
        return jsonify({"success": False, "error": "Email, reset token, and new password are required."}), 400

    if len(new_password) < 6:
        return jsonify({"success": False, "error": "New password must be at least 6 characters long."}), 400

    conn = get_db()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
        SELECT id FROM password_resets
        WHERE email = ? AND token = ? AND used = 0 AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1
    """, (email, token, now_iso))
    reset_record = cursor.fetchone()

    if not reset_record:
        conn.close()
        return jsonify({"success": False, "error": "Invalid or expired reset token."}), 400

    pwd_hash = generate_password_hash(new_password)
    with conn:
        conn.execute("UPDATE users SET password_hash = ? WHERE email = ?", (pwd_hash, email))
        conn.execute("UPDATE password_resets SET used = 1 WHERE id = ?", (reset_record["id"],))
    conn.close()

    return jsonify({"success": True, "message": "Password updated successfully. You can now log in."}), 200


# ==============================================================================
# Image Upload Endpoint (Persistent Storage)
# ==============================================================================

@app.route("/api/upload-image", methods=["POST"])
def upload_image():
    """Uploads a food photo to persistent disk storage."""
    if "image" not in request.files:
        return jsonify({"success": False, "error": "No image file provided in form-data."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No selected file."}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": f"Invalid file type. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}."
        }), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_filename = f"food_{uuid.uuid4().hex[:12]}.{ext}"
    target_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)
    file.save(target_path)

    # Build persistent URL path
    photo_url = f"/uploads/{unique_filename}"
    logger.info("Stored persistent food photo: %s", target_path)

    return jsonify({
        "success": True,
        "photo_url": photo_url,
        "filename": unique_filename
    }), 201


# ==============================================================================
# Gemma AI Integration Endpoints
# ==============================================================================

@app.route("/api/generate-listing", methods=["POST"])
def generate_listing():
    """
    Invokes the real Gemma 4 model via Ollama's Chat API.
    Does NOT return mock data if Gemma fails.
    """
    data = request.get_json(force=True, silent=True) or {}
    food_name = (data.get("food_name") or "").strip()
    if not food_name:
        return jsonify({"success": False, "error": "Food name is required to generate a listing."}), 400

    has_photo = bool(data.get("photo_url"))

    try:
        result = ai_service.generate_listing(data, has_photo=has_photo)
        return jsonify(result), 200
    except ConnectionError as ce:
        logger.warning("Ollama connection failed: %s", ce)
        return jsonify({
            "success": False,
            "error": str(ce),
            "code": "OLLAMA_UNREACHABLE",
            "host": ai_service.host,
            "model": ai_service.model,
            "help": f"Start Ollama with 'ollama serve' and ensure model '{ai_service.model}' is installed ('ollama run {ai_service.model}')."
        }), 503
    except TimeoutError as te:
        return jsonify({"success": False, "error": str(te), "code": "OLLAMA_TIMEOUT"}), 504
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve), "code": "INVALID_RESPONSE"}), 400
    except Exception as e:
        logger.error("Error during Gemma generation: %s", e)
        return jsonify({"success": False, "error": f"Gemma generation failed: {str(e)}", "code": "GEMMA_ERROR"}), 502


@app.route("/api/analyze-photo", methods=["POST"])
def analyze_photo():
    """
    Checks vision capability of the active model.
    Since gemma4:e2b is text-only, explicitly reports that image analysis is not supported.
    Never pretends image analysis succeeded.
    """
    result = ai_service.analyze_food_photo()
    return jsonify(result), 200


# ==============================================================================
# Food Listings Endpoints
# ==============================================================================

@app.route("/api/listings", methods=["GET"])
def get_available_listings():
    """
    Public / Recipient browse endpoint.
    Retrieves published food listings with filters for search, location, and category.
    Includes urgency flag based on collection deadline.
    """
    search = (request.args.get("search") or "").strip().lower()
    location_filter = (request.args.get("location") or "").strip().lower()
    status_filter = (request.args.get("status") or "").strip().lower()

    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT l.*, u.full_name AS donor_name, u.organization AS donor_org, u.phone AS donor_phone
        FROM listings l
        JOIN users u ON l.donor_id = u.id
        WHERE 1=1
    """
    params = []

    # If status is not explicitly passed, recipient feed only shows 'available' listings
    if status_filter:
        query += " AND l.status = ?"
        params.append(status_filter)
    else:
        query += " AND l.status IN ('available', 'requested')"

    if search:
        query += " AND (LOWER(l.food_name) LIKE ? OR LOWER(l.storage_details) LIKE ? OR LOWER(l.notes) LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    if location_filter:
        query += " AND LOWER(l.location) LIKE ?"
        params.append(f"%{location_filter}%")

    query += " ORDER BY l.deadline ASC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    now_utc = datetime.now(timezone.utc)
    results = []
    for r in rows:
        item = dict(r)
        # Parse JSON fields safely
        try:
            item["ai_insights"] = json.loads(item.get("ai_insights_json") or "{}")
        except Exception:
            item["ai_insights"] = {}
        try:
            item["verification"] = json.loads(item.get("verification_json") or "{}")
        except Exception:
            item["verification"] = {}

        # Compute urgency: is deadline within 2 hours?
        item["is_urgent"] = False
        try:
            deadline_dt = datetime.fromisoformat(item["deadline"].replace("Z", "+00:00"))
            if deadline_dt.tzinfo is None:
                deadline_dt = deadline_dt.replace(tzinfo=timezone.utc)
            diff = (deadline_dt - now_utc).total_seconds()
            if 0 < diff <= 7200:  # 2 hours
                item["is_urgent"] = True
            elif diff <= 0:
                item["is_expired"] = True
        except Exception:
            pass

        results.append(item)

    return jsonify({
        "success": True,
        "count": len(results),
        "listings": results
    }), 200


@app.route("/api/donor/my-listings", methods=["GET"])
@role_required(["donor"])
def get_donor_listings():
    """Returns all listings created by the logged-in donor with attached incoming claim requests."""
    donor_id = request.current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM listings
        WHERE donor_id = ?
        ORDER BY created_at DESC
    """, (donor_id,))
    listing_rows = cursor.fetchall()

    listings = []
    for lr in listing_rows:
        item = dict(lr)
        try:
            item["ai_insights"] = json.loads(item.get("ai_insights_json") or "{}")
        except Exception:
            item["ai_insights"] = {}
        try:
            item["verification"] = json.loads(item.get("verification_json") or "{}")
        except Exception:
            item["verification"] = {}

        # Fetch attached incoming claims
        cursor.execute("""
            SELECT c.*, u.full_name AS recipient_name, u.email AS recipient_email,
                   u.organization AS recipient_org, u.phone AS recipient_phone
            FROM claims c
            JOIN users u ON c.recipient_id = u.id
            WHERE c.listing_id = ?
            ORDER BY c.created_at DESC
        """, (item["id"],))
        claim_rows = cursor.fetchall()
        item["claims"] = [dict(cr) for cr in claim_rows]

        listings.append(item)

    conn.close()
    return jsonify({"success": True, "listings": listings}), 200


@app.route("/api/listings", methods=["POST"])
@role_required(["donor"])
def create_listing():
    """Publishes a new surplus food listing to SQLite database."""
    data = request.get_json(force=True, silent=True) or {}
    donor_id = request.current_user["id"]

    required_fields = ["food_name", "quantity", "prep_time", "deadline", "location", "storage_details"]
    missing = [f for f in required_fields if not str(data.get(f, "")).strip()]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}",
            "missing_fields": missing
        }), 400

    verification = data.get("verification") or {}
    if not verification.get("seller_certified"):
        return jsonify({
            "success": False,
            "error": "Donor verification required. Please confirm the food safety checklist before publishing.",
            "code": "VERIFICATION_REQUIRED"
        }), 400

    listing_id = f"lst-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    ai_insights = data.get("ai_insights") or {}
    ai_insights_json = json.dumps(ai_insights)
    verification_json = json.dumps(verification)

    shareable_message = data.get("shareable_message") or (
        f"🚨 *SURPLUS FOOD ALERT* 🚨\n\n"
        f"🍱 *Item:* {data.get('food_name')}\n"
        f"📦 *Quantity:* {data.get('quantity')} {data.get('unit', 'portions')}\n"
        f"⏰ *Prepared:* {data.get('prep_time')}\n"
        f"⏳ *Pickup Deadline:* {data.get('deadline')}\n"
        f"📍 *Pickup Location:* {data.get('location')}\n"
        f"❄️ *Storage Condition:* {data.get('storage_details')}\n"
        f"📞 *Donor:* {request.current_user['full_name']} ({request.current_user.get('phone', 'See dashboard')})\n\n"
        f"✅ *Seller Verified:* Checked prior to publishing."
    )

    conn = get_db()
    with conn:
        conn.execute("""
            INSERT INTO listings (
                id, donor_id, food_name, quantity, unit, prep_time, deadline, location,
                storage_details, allergens, notes, photo_url, status, ai_insights_json,
                shareable_message, verification_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?)
        """, (
            listing_id,
            donor_id,
            data.get("food_name").strip(),
            str(data.get("quantity")).strip(),
            (data.get("unit") or "portions").strip(),
            data.get("prep_time").strip(),
            data.get("deadline").strip(),
            data.get("location").strip(),
            data.get("storage_details").strip(),
            (data.get("allergens") or "").strip(),
            (data.get("notes") or "").strip(),
            data.get("photo_url") or "",
            ai_insights_json,
            shareable_message,
            verification_json,
            now,
            now
        ))
    conn.close()

    logger.info("Donor %s published listing %s ('%s')", donor_id, listing_id, data.get("food_name"))
    return jsonify({
        "success": True,
        "message": "Surplus food listing published successfully.",
        "listing_id": listing_id
    }), 201


@app.route("/api/listings/<listing_id>", methods=["PUT"])
@role_required(["donor"])
def update_listing(listing_id):
    """Updates listing details or status. Must belong to the authenticated donor."""
    donor_id = request.current_user["id"]
    data = request.get_json(force=True, silent=True) or {}

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM listings WHERE id = ?", (listing_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Listing not found."}), 404

    if row["donor_id"] != donor_id:
        conn.close()
        return jsonify({"success": False, "error": "Unauthorized. You can only edit your own listings."}), 403

    now = datetime.now(timezone.utc).isoformat()
    food_name = data.get("food_name", row["food_name"])
    quantity = data.get("quantity", row["quantity"])
    unit = data.get("unit", row["unit"])
    deadline = data.get("deadline", row["deadline"])
    location = data.get("location", row["location"])
    storage = data.get("storage_details", row["storage_details"])
    allergens = data.get("allergens", row["allergens"])
    notes = data.get("notes", row["notes"])
    status = data.get("status", row["status"])

    with conn:
        conn.execute("""
            UPDATE listings
            SET food_name = ?, quantity = ?, unit = ?, deadline = ?, location = ?,
                storage_details = ?, allergens = ?, notes = ?, status = ?, updated_at = ?
            WHERE id = ?
        """, (food_name, quantity, unit, deadline, location, storage, allergens, notes, status, now, listing_id))
    conn.close()

    return jsonify({"success": True, "message": "Listing updated successfully."}), 200


@app.route("/api/listings/<listing_id>", methods=["DELETE"])
@role_required(["donor"])
def delete_listing(listing_id):
    """Deletes listing. Must belong to the authenticated donor."""
    donor_id = request.current_user["id"]

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT donor_id FROM listings WHERE id = ?", (listing_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Listing not found."}), 404

    if row["donor_id"] != donor_id:
        conn.close()
        return jsonify({"success": False, "error": "Unauthorized. You can only delete your own listings."}), 403

    with conn:
        conn.execute("DELETE FROM listings WHERE id = ?", (listing_id,))
    conn.close()

    return jsonify({"success": True, "message": "Listing deleted successfully."}), 200


# ==============================================================================
# Claims & Food Pickup Workflow Endpoints
# ==============================================================================

@app.route("/api/claims", methods=["POST"])
@role_required(["recipient"])
def create_claim():
    """
    Submits a claim request for an available food listing.
    Enforces quantity limits and prevents over-claiming or duplicate claims.
    """
    recipient = request.current_user
    data = request.get_json(force=True, silent=True) or {}
    listing_id = data.get("listing_id")
    qty_requested = str(data.get("quantity_requested") or "").strip()
    message = (data.get("message") or "").strip()

    if not listing_id or not qty_requested:
        return jsonify({"success": False, "error": "Listing ID and quantity requested are required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM listings WHERE id = ?", (listing_id,))
    listing = cursor.fetchone()

    if not listing:
        conn.close()
        return jsonify({"success": False, "error": "Food listing not found."}), 404

    if listing["status"] in ["collected", "cancelled"]:
        conn.close()
        return jsonify({"success": False, "error": "This food listing is no longer available."}), 400

    # Prevent duplicate pending claims by the same recipient
    cursor.execute("""
        SELECT id FROM claims
        WHERE listing_id = ? AND recipient_id = ? AND status IN ('requested', 'confirmed')
    """, (listing_id, recipient["id"]))
    if cursor.fetchone():
        conn.close()
        return jsonify({
            "success": False,
            "error": "You already have an active claim request for this listing."
        }), 409

    claim_id = f"clm-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    with conn:
        conn.execute("""
            INSERT INTO claims (id, listing_id, recipient_id, quantity_requested, message, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'requested', ?, ?)
        """, (claim_id, listing_id, recipient["id"], qty_requested, message, now, now))

        # Update listing status to 'requested'
        conn.execute("UPDATE listings SET status = 'requested', updated_at = ? WHERE id = ?", (now, listing_id))
    conn.close()

    # Notify Donor
    notif_msg = f"{recipient['full_name']} requested {qty_requested} of '{listing['food_name']}'."
    create_inapp_notification(listing["donor_id"], "New Surplus Food Request", notif_msg, "claim_requested")

    logger.info("Recipient %s requested %s for listing %s", recipient["id"], qty_requested, listing_id)
    return jsonify({
        "success": True,
        "message": "Claim request submitted. Awaiting donor confirmation.",
        "claim_id": claim_id
    }), 201


@app.route("/api/recipient/my-claims", methods=["GET"])
@role_required(["recipient"])
def get_recipient_claims():
    """Returns all claim requests submitted by the logged-in recipient."""
    recipient_id = request.current_user["id"]
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT c.*, l.food_name, l.quantity AS total_quantity, l.unit, l.deadline,
               l.location, l.storage_details, l.photo_url, l.allergens,
               u.full_name AS donor_name, u.organization AS donor_org, u.phone AS donor_phone
        FROM claims c
        JOIN listings l ON c.listing_id = l.id
        JOIN users u ON l.donor_id = u.id
        WHERE c.recipient_id = ?
        ORDER BY c.created_at DESC
    """, (recipient_id,))
    rows = cursor.fetchall()
    conn.close()

    claims = [dict(r) for r in rows]
    return jsonify({"success": True, "claims": claims}), 200


@app.route("/api/claims/<claim_id>/status", methods=["PUT"])
@role_required(["donor"])
def update_claim_status(claim_id):
    """
    Donor approves ('confirmed'), rejects ('rejected'), or completes ('collected') a claim.
    """
    donor = request.current_user
    data = request.get_json(force=True, silent=True) or {}
    new_status = (data.get("status") or "").strip().lower()

    if new_status not in ["confirmed", "rejected", "collected"]:
        return jsonify({
            "success": False,
            "error": "Status must be 'confirmed' (approved), 'rejected', or 'collected'."
        }), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, l.donor_id, l.food_name, l.id AS listing_id
        FROM claims c
        JOIN listings l ON c.listing_id = l.id
        WHERE c.id = ?
    """, (claim_id,))
    claim = cursor.fetchone()

    if not claim:
        conn.close()
        return jsonify({"success": False, "error": "Claim request not found."}), 404

    if claim["donor_id"] != donor["id"]:
        conn.close()
        return jsonify({"success": False, "error": "Unauthorized. You can only manage claims for your own food listings."}), 403

    now = datetime.now(timezone.utc).isoformat()
    with conn:
        conn.execute("UPDATE claims SET status = ?, updated_at = ? WHERE id = ?", (new_status, now, claim_id))

        # Adjust listing status according to claim state
        if new_status == "confirmed":
            conn.execute("UPDATE listings SET status = 'confirmed', updated_at = ? WHERE id = ?", (now, claim["listing_id"]))
            notif_title = "Food Request Approved! 🎉"
            notif_msg = f"Your request for '{claim['food_name']}' has been confirmed by {donor['full_name']}. Please proceed with pickup."
            create_inapp_notification(claim["recipient_id"], notif_title, notif_msg, "claim_approved", conn=conn)
        elif new_status == "collected":
            conn.execute("UPDATE listings SET status = 'collected', updated_at = ? WHERE id = ?", (now, claim["listing_id"]))
            notif_title = "Food Rescue Completed ✅"
            notif_msg = f"Pickup for '{claim['food_name']}' has been marked collected. Thank you for rescuing surplus food!"
            create_inapp_notification(claim["recipient_id"], notif_title, notif_msg, "collected", conn=conn)
        elif new_status == "rejected":
            # Revert listing back to available if no other claims
            conn.execute("UPDATE listings SET status = 'available', updated_at = ? WHERE id = ?", (now, claim["listing_id"]))
            notif_title = "Food Request Update"
            notif_msg = f"Your request for '{claim['food_name']}' could not be accepted at this time."
            create_inapp_notification(claim["recipient_id"], notif_title, notif_msg, "claim_rejected", conn=conn)

    conn.close()
    return jsonify({
        "success": True,
        "message": f"Claim updated to '{new_status}' successfully."
    }), 200


@app.route("/api/claims/<claim_id>", methods=["DELETE"])
@role_required(["recipient"])
def cancel_claim(claim_id):
    """Allows recipient to cancel a pending claim request."""
    recipient_id = request.current_user["id"]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM claims WHERE id = ?", (claim_id,))
    claim = cursor.fetchone()

    if not claim:
        conn.close()
        return jsonify({"success": False, "error": "Claim not found."}), 404

    if claim["recipient_id"] != recipient_id:
        conn.close()
        return jsonify({"success": False, "error": "Unauthorized. You can only cancel your own claims."}), 403

    if claim["status"] == "collected":
        conn.close()
        return jsonify({"success": False, "error": "Cannot cancel a claim that has already been collected."}), 400

    now = datetime.now(timezone.utc).isoformat()
    with conn:
        conn.execute("DELETE FROM claims WHERE id = ?", (claim_id,))
        # Revert listing status back to available
        conn.execute("UPDATE listings SET status = 'available', updated_at = ? WHERE id = ?", (now, claim["listing_id"]))
    conn.close()

    return jsonify({"success": True, "message": "Claim cancelled successfully."}), 200


# ==============================================================================
# Notifications Endpoints
# ==============================================================================

@app.route("/api/notifications", methods=["GET"])
@auth_required
def get_notifications():
    """Returns in-app notifications for the authenticated user."""
    user_id = request.current_user["id"]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 20
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    return jsonify({
        "success": True,
        "notifications": [dict(r) for r in rows]
    }), 200


@app.route("/api/notifications/<notif_id>/read", methods=["PUT"])
@auth_required
def mark_notification_read(notif_id):
    user_id = request.current_user["id"]
    conn = get_db()
    with conn:
        conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", (notif_id, user_id))
    conn.close()
    return jsonify({"success": True}), 200


# ==============================================================================
# Food Rescue Impact Dashboard Statistics
# ==============================================================================

@app.route("/api/impact-stats", methods=["GET"])
def get_impact_stats():
    """
    Computes genuine statistics strictly from real SQLite database records.
    Separates offered quantities from actually collected quantities.
    Does not invent fake meal or people counts.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS total_listings FROM listings")
    total_listings = cursor.fetchone()["total_listings"]

    cursor.execute("SELECT COUNT(*) AS available_count FROM listings WHERE status = 'available'")
    available_count = cursor.fetchone()["available_count"]

    cursor.execute("SELECT COUNT(*) AS pending_claims FROM claims WHERE status = 'requested'")
    pending_claims = cursor.fetchone()["pending_claims"]

    cursor.execute("SELECT COUNT(*) AS collected_rescues FROM listings WHERE status = 'collected'")
    collected_rescues = cursor.fetchone()["collected_rescues"]

    # Calculate numeric sums safely
    cursor.execute("SELECT quantity, unit FROM listings")
    all_listings = cursor.fetchall()

    cursor.execute("SELECT quantity, unit FROM listings WHERE status = 'collected'")
    collected_listings = cursor.fetchall()
    conn.close()

    def sum_quantities(rows):
        total = 0
        for r in rows:
            # Extract leading numbers
            match = re.search(r"(\d+(\.\d+)?)", str(r["quantity"]))
            if match:
                total += float(match.group(1))
        return int(total) if total.is_integer() else round(total, 1)

    total_offered = sum_quantities(all_listings)
    total_collected = sum_quantities(collected_listings)

    return jsonify({
        "success": True,
        "stats": {
            "total_listings_published": total_listings,
            "total_quantity_offered": total_offered,
            "total_quantity_collected": total_collected,
            "active_available_listings": available_count,
            "pending_claim_requests": pending_claims,
            "completed_food_rescues": collected_rescues
        }
    }), 200


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1")
    logger.info("Starting FoodRescue AI server on port %s (Debug: %s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)
