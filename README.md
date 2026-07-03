# Agri Insights Hub v2 — JWT + Role-Based Auth

A complete upgrade of the Agri Insights Hub with JWT authentication, role-based dashboards for **Farmer** and **Retailer**, AI-powered features via Groq, and browser geolocation support.

---

# Project Overview

| Feature | Description |
|----------|-------------|
| **Authentication** | Custom JWT Authentication (bcrypt + jsonwebtoken) |
| **User Roles** | Farmer, Retailer |
| **Farmer Dashboard** | Weather, AI Chatbot, Government Yojna Schemes, Nearby Retailers |
| **Retailer Dashboard** | Inventory Management, Low Stock Alerts, Demand Prediction, Analytics Charts |
| **Geolocation** | Browser Geolocation with Reverse Geocoding using Nominatim |
| **AI Integration** | Groq API (llama3-8b-8192) for AI Chatbot and Government Scheme Recommendations |
| **Backend** | Node.js, Express.js, MongoDB, JWT Middleware |
| **Frontend** | React.js, Vite, Tailwind CSS |
| **Database** | MongoDB |
| **Password Security** | bcrypt Password Hashing |
| **Authorization** | JWT Protected Routes |
| **Deployment** | Frontend on Vercel, Backend on Render |

---

## Project Structure

```
agri-insights-hub-v2/
├── backend/
│   ├── src/
│   │   ├── controllers/    # auth, product, ai
│   │   ├── middleware/     # JWT auth + role check
│   │   ├── models/         # User, Product (Mongoose)
│   │   ├── routes/         # auth, product, ai routes
│   │   ├── lib/            # db, env helpers
│   │   └── server.js       # Express entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/        # AuthContext (JWT token management)
│   │   ├── hooks/          # use-geolocation, use-toast
│   │   ├── pages/          # role-split dashboards + farmer pages
│   │   ├── components/     # Navbar (role-aware), Layout, Footer, shadcn/ui
│   │   ├── lib/            # api.ts (JWT headers)
│   │   └── services/       # weatherService, demandService
│   ├── .env.example
│   └── package.json
└── database/
    └── schema.sql          # SQL schema reference + sample queries
```

---

## Quick Start

### 1. MongoDB
Make sure MongoDB is running locally, or update `MONGODB_URI` in your `.env`.

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, GROQ_API_KEY
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_OPENWEATHER_API_KEY (free at openweathermap.org)
npm install
npm run dev
# Runs on http://localhost:8081
```

---

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agri_insights
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_xxxxxxxxxxxx   # get free at console.groq.com
NODE_ENV=development
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_OPENWEATHER_API_KEY=your_key   # free at openweathermap.org
```

---

## API Endpoints

### Auth (public)
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register as farmer or retailer |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET  | `/api/auth/me` | Get current user (protected) |
| PATCH | `/api/auth/location` | Update geolocation (protected) |

### Products (JWT required — retailer role for writes)
| Method | Route | Description |
|---|---|---|
| GET | `/api/products` | Get user's products |
| GET | `/api/products/stats` | Get inventory stats |
| GET | `/api/products/trend` | Monthly trend data |
| POST | `/api/products` | Add product (retailer only) |
| PUT | `/api/products/:id` | Update product (retailer only) |
| DELETE | `/api/products/:id` | Delete product (retailer only) |

### AI (JWT required — farmer role)
| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/chat` | AI farming chatbot (Groq) |
| POST | `/api/ai/yojna` | Fetch govt schemes (Groq) |
| GET | `/api/ai/nearby-retailers` | Get registered retailers |

---

## Role Features

### 🌾 Farmer
- Dashboard with **live weather** (browser geolocation → OpenWeatherMap)
- **AI Chatbot** (Groq llama3) for farming questions
- **Government Schemes** (Yojnas) — AI-fetched and personalized
- **Nearby Retailers** — shows registered agri retailers
- Weather forecast page (5-day)

### 🏪 Retailer
- Dashboard with inventory stats, charts
- **Inventory Management** — add, edit, delete products + billing
- **Alerts** — low stock, overstock, expiry warnings
- **Weather** forecast
- **Demand Prediction** (AI-based)

---

## Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Start backend (serves frontend from dist/)
cd backend && npm start
```

The Express server serves the React `dist/` folder and proxies API calls.
