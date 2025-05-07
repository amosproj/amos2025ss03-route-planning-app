# VRP-App Backend

This directory contains the backend server for the Vehicle Routing Problem (VRP) application. The backend provides a REST API for solving vehicle routing problems using Google OR-Tools.

## Features

- REST API for solving VRP instances
- Support for various constraints:
  - Time windows
  - Required skills for nodes
  - Vehicle skill capabilities
- Automatic API documentation with Swagger UI
- Built with FastAPI and OR-Tools

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Setup

1. Create and activate a virtual environment:

```bash
# Create a virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```

2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Running the Server

Start the backend server by running:

```bash
uvicorn app:app --reload --port 8080
```

Alternatively, you can use:

```bash
python app.py
```

The server will start on port 8080 by default and will be accessible at `http://localhost:8080`.

## API Documentation

FastAPI automatically generates interactive API documentation:

- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`

## API Endpoints

### Test Endpoint

- **URL**: `/api/test`
- **Method**: GET
- **Response**: JSON object with a message confirming CORS is working

### Solve VRP

- **URL**: `/api/solve`
- **Method**: POST
- **Content-Type**: application/json
- **Request Body**: JSON object with the VRP instance data
  - `nodes`: Array of node objects (with id, x, y, is_depot, time_window, required_skills)
  - `num_vehicles`: Number of vehicles
  - `available_skills`: Array of all available skills
  - `vehicle_skills`: Object mapping vehicle IDs to arrays of skills
- **Response**: JSON object with:
  - `status`: "success" or "error"
  - `routes`: Array of routes (arrays of node IDs) if successful
  - `max_distance`: Maximum route distance if successful
  - `total_distance`: Total distance of all routes if successful
  - `message`: Error message if unsuccessful

## Solver Implementation

The VRP solver (`solver.py`) uses Google OR-Tools to solve the vehicle routing problem with various constraints:

1. **Distance Calculation**: Euclidean distance between nodes (scaled for OR-Tools integer requirements)
2. **Constraints**:
   - Distance constraints to minimize total distance
   - Time window constraints (if specified)
   - Skill requirements (matching node required skills with vehicle capabilities)
3. **Algorithm**: Uses Guided Local Search metaheuristic with Path Cheapest Arc initial solution strategy

## Development

- Modify `app.py` to add new API endpoints
- Extend `solver.py` to add new constraints or solution techniques
- Update CORS settings in `app.py` for production deployments
- Use Pydantic models to benefit from FastAPI's automatic validation and documentation