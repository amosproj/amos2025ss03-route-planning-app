# 🧭 AMOS Project (AMOS SS 2025)

A full-stack **route planning application** that leverages Google Maps APIs, React (with TanStack tools), FastAPI, and Google OR-Tools to generate optimized routes based on input data.

---

## ⚙️ Technologies Used

### 🖥️ Frontend Application (React + Vite)

- **TypeScript** – Strongly typed programming language that builds on JavaScript.
- **React** – UI library for building interactive user interfaces.
- **Vite** – Fast build tool for modern frontend projects.
- **Tailwind CSS** – Utility-first CSS framework for styling.
- **Shadcn UI** – Component library based on Tailwind CSS.
- **TanStack Router** – Type-safe routing for React apps.
- **TanStack Query** – Data-fetching and state management.
- **Google Maps JavaScript API** – Enables map visualization and route rendering.

### 🛠️ Backend Application (FastAPI)

- **Python** – Backend logic and API development.
- **FastAPI** – High-performance web framework for APIs.
- **Google OR-Tools** – Optimization engine for solving routing problems.
- **Google Maps Distance Matrix API** – Calculates distances and durations between coordinates.

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
