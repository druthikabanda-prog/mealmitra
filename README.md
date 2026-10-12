# 🌱 MealMitra

> **Rescue Food. Nourish Lives.**  
> Offline-Capable Progressive Web App (PWA) for surplus food coordination powered by local Gemma 4 AI via Ollama.

**MealMitra** is a complete, offline-first food rescue platform designed to help college canteens, bakeries, restaurants, and food businesses organize surplus food for timely reuse or donation to local food pantries and community shelters before quality degrades.

Built with a **React + Vite + Tailwind CSS** frontend, a **Python Flask + SQLite** backend, and real local **Gemma 4 AI** integration through **Ollama**.

---

## 📸 Key Features

1. **Brand Identity & Mission**:
   - Website Name: **MealMitra**
   - Tagline: *"Rescue Food. Nourish Lives."*
   - Clean, minimal public footer with zero technical stack clutter.

2. **Progressive Web App (PWA) & Offline Mode**:
   - Web App Manifest (`manifest.json`), service worker caching (`sw.js`), and installable app icons.
   - Works offline after initial load using **IndexedDB (`MealMitraDB`)**.
   - Offline food listing preparation with image attachment.
   - Offline drafts are strictly labeled: **"Saved Draft — Not Published"**.
   - Offline feed displays previously fetched listings with timestamp and explicit notification that availability is not guaranteed.
   - Offline claims are safely blocked with server verification notice to prevent duplicate claims.
   - One-click safe synchronization and publishing upon reconnecting.

3. **100% Local Gemma 4 AI (Zero-Internet AI)**:
   - Connects Flask to Ollama at `http://localhost:11434`.
   - Uses the locally installed model `gemma4:e2b` (or `gemma:2b`).
   - Runs inference locally on your machine with **zero internet connection** and **no cloud dependencies**.
   - **Zero-Mock Policy**: If Ollama or Gemma is unavailable, reports the exact local error without deceptive mock output.

4. **Strict Food Safety & Responsible AI**:
   - **No Algorithmic Safety Guarantees**: Clear disclaimers that AI cannot certify bacterial safety or freshness.
   - **Zero Hallucination**: AI never invents missing expiry dates, quantities, preparation times, or allergens. Missing items are highlighted in a missing-details checklist.
   - **Photo Inspection Caveat**: Visual photo appearance does not replace temperature and storage checks.
   - **Controlled Distribution**: No automatic broadcasting; donors retain full control over shareable alerts.

5. **User Roles & Dashboard**:
   - Single account supports both **Donate Food** and **Find Food** roles.
   - Complete authentication (Email/Password, bcrypt hashing, JWT tokens).
   - In-app notification center and real-time claim status tracking (Requested, Confirmed, Collected, Cancelled).
   - Dynamic community impact counter (kg food saved, meals provided, CO₂ reduced).

---

## 🎨 Color Palette & Design
- **Green** (`#16a34a`, `#15803d`, `#14532d`, `#f0fdf4`) — Freshness, trust, and sustainability.
- **Cream** (`#faf7f2`, `#faf6ee`, `#ebdcc0`) — Warm hospitality and clean presentation.
- **Orange** (`#ea580c`, `#f97316`, `#fff7ed`) — Urgency, pickup deadline alerts, and community action.

---

## 🛠️ Architecture

```
MealMitra/
├── backend/
│   ├── app.py                 # Flask server with REST API routes & SQLite WAL mode
│   ├── ai_service.py          # Local Ollama Gemma 4 AI service module
│   ├── db.py                  # SQLite schema, indices, migrations & seed data
│   ├── requirements.txt       # Flask, flask-cors, requests, python-dotenv, werkzeug
│   ├── .env.example           # Backend environment configuration
│   └── tests/
│       └── test_api.py        # Automated test suite (8 integration tests)
├── frontend/
│   ├── public/
│   │   ├── manifest.json      # PWA Web App Manifest
│   │   ├── sw.js              # Service Worker (offline shell & asset cache)
│   │   └── icons/             # PWA app icons (192x192, 512x512)
│   ├── src/
│   │   ├── components/        # Navbar, SafetyBanner, AddFoodForm, ListingCard, UserDashboard, etc.
│   │   ├── services/
│   │   │   ├── api.js         # REST API client
│   │   │   └── offlineStorage.js # IndexedDB persistence for offline drafts & feed cache
│   │   ├── App.jsx            # Main app shell & online/offline coordinator
│   │   └── index.css          # Tailwind base & custom styling
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── .gitignore
├── .env.example
└── README.md
```

---

## 🚀 Running on Windows (Step-by-Step)

### Prerequisites
- **Node.js** v18+
- **Python** 3.10+
- **Ollama** installed locally on Windows

---

### Step 1: Start Ollama & Local Gemma 4 Model

In PowerShell:

```powershell
# 1. Start Ollama server locally
ollama serve

# 2. In another terminal, verify the downloaded model is available
ollama run gemma4:e2b
```

---

### Step 2: Start Flask Backend

In a new terminal:

```powershell
cd "backend"

# Install Python dependencies
python -m pip install -r requirements.txt

# Start Flask
python app.py
```

The Flask server will start on: **`http://127.0.0.1:5000`**

#### Demo Accounts (Preloaded in SQLite):
- **Food Donor**: `donor@canteen.edu` | Password: `Password123!` (Chef Marcus, Central Canteen)
- **Food Recipient**: `recipient@foodbank.org` | Password: `Password123!` (Sarah Jenkins, Campus Food Pantry)

---

### Step 3: Start React Frontend

In another terminal:

```powershell
cd "frontend"

# Install packages
npm install

# Start Vite dev server
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

Run backend integration test suite verifying authentication, Ollama AI integration, role enforcement, and SQLite transactions:

```powershell
cd "backend"
python -m unittest tests/test_api.py
```

All 8 tests verify:
- System health reporting with local Gemma 4 detection
- Secure donor & recipient registration and login
- Mandatory input validation for AI listing generation
- Zero-mock error handling when services are unreachable
- Safe listing creation, status lifecycle, claims, and pickup confirmations
- Multi-recipient safety checks and duplicate claim prevention

---

## 🛡️ Responsible AI & Offline Safety Rules

1. **No Algorithmic Safety Certifications**: Food safety and biological freshness cannot be determined via AI text or photos. Food donors remain solely responsible for physical inspection and temperature records.
2. **Zero Hallucination**: Preparation timestamps, pickup deadlines, storage conditions, and allergens are non-negotiable physical facts. The model never invents missing values.
3. **Offline Claim Safety**: Offline claim requests are never confirmed locally without real-time database validation to prevent double-claiming food.
4. **Credential Safety**: Service workers and IndexedDB caches never store user passwords or sensitive session tokens.
