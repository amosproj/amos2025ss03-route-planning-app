<div align="center">
<img src="https://github.com/amosproj/amos2025ss03-route-planning-app/blob/main/Deliverables/sprint-01/team-logo.svg" width="400">
<div>Smart Route Planning</div>
</div>

---

# 🧭 AMOS Project Wiki

Welcome to the **AMOS (Smart Route Planning)** project wiki! This system is designed to optimize routing and scheduling for field service workers, helping organizations reduce travel time, lower costs, and increase operational efficiency.

## 🚀 Overview

AMOS is a route optimization platform that intelligently plans service routes based on various constraints and goals, including:

- **Minimizing travel time and cost**
- **Maximizing worker productivity and profit**
- **Supporting both fixed and flexible scheduling**
- **Visualizing optimized routes using Google Maps**

## 🎯 Key Features

- 📍 **Route Optimization**: Computes optimal paths for workers considering job locations, time windows, and constraints.
- 🗺️ **Map Visualization**: Interactive map with:
  - Color-coded routes
  - Numbered stops
  - Start/end markers
  - Auto-zoom to fit all stops
- ⚙️ **optimize API**: Accepts job data and returns optimized routes.

## 🔧 Tech Stack

- **Frontend**: React + TypeScript + Vite + react-google-maps
- **Backend**: FastAPI (Python) or Express (Node.js)
- **Google Maps API**: For route and location visualization
- **GitHub Actions**: For CI/CD (under setup)

---

## 🐳 Run with Docker (Recommended)

### 1. Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Clone the repository

```bash
git clone https://github.com/amosproj/amos2025ss03-route-planning-app.git
cd amos2025ss03-route-planning-app
```

### 3. Add environment variables

Create and fill in:

- `frontend/.env`
- `backend/.env`

### 4. Build and run containers

```bash
docker-compose up --build
```

### 5. Access the applications

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8080](http://localhost:8080)

---

## 🧪 Run Locally (Without Docker)

### 🔧 Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

### 🛠 Backend (FastAPI with venv)

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Start the backend server by running:

```bash
uvicorn app:app --reload --port 8080
```

Alternatively, you can use:

```bash
python app.py
```

FastAPI automatically generates interactive API documentation:

- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

---

## 🏗️ Build Frontend for Production

```bash
cd frontend
npm run build
```

The build output will be in the `frontend/dist` directory.

---

## 🧾 Example `.env` Files

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_MAPS_API_KEY=supersecretkey
```

### `backend/.env`

```env
GOOGLE_MAPS_API_KEY=supersecretkey
```

---

## ❗ Notes

- Make sure ports **3000** (frontend) and **8080** (backend) are available.
- `.env` files are required in both `frontend/` and `backend/` for proper configuration.
