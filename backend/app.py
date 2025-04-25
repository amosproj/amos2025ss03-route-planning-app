# backend/app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union
from solver import solve_vrp

app = FastAPI(title="VRP Solver API", 
              description="API for solving Vehicle Routing Problems for field service workers")

# Configure CORS for development
# For production, restrict the origin more specifically
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Define data models
class Node(BaseModel):
    id: str | int
    x: float
    y: float
    is_depot: bool
    time_window: Optional[List[float]] = None
    required_skills: Optional[List[str]] = None

class VRPData(BaseModel):
    nodes: List[Node]
    num_vehicles: int
    available_skills: Optional[List[str]] = Field(default_factory=list)
    vehicle_skills: Optional[Dict[str, List[str]]] = Field(default_factory=dict)

class VRPResponse(BaseModel):
    status: str
    routes: Optional[List[List[str|int]]] = None
    max_distance: Optional[float] = None
    total_distance: Optional[float] = None
    message: Optional[str] = None

@app.get("/api/test")
def handle_test():
    print("--- /api/test endpoint hit ---")
    return {"message": "CORS test successful!"}

@app.post("/api/solve", response_model=VRPResponse)
def handle_solve(data: VRPData):
    # Convert Pydantic model to dict for solver
    data_dict = data.dict()
    
    # Solve the VRP
    result = solve_vrp(data_dict)
    
    if result.get("status") != "success":
        status_code = 400 if result.get("status") == "error" else 500
        raise HTTPException(
            status_code=status_code,
            detail=result.get("message", "An error occurred during solving")
        )
    
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5002, reload=True)