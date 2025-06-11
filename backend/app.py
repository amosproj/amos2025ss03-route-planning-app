# backend/app.py
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from inputAnalyzer import *
from solver.solver import solve_appointment_routing
from solver.models import *
from testdata.data_generator import create_testdata_optimization_request
from distance_matrix import get_distance_matrix_with_cache
from redis_client import RedisClient

load_dotenv()


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

@app.on_event("startup")
async def startup_event():
    RedisClient.get_client()

# API Endpoints
@app.get("/api/test")
def handle_test():
    print("--- /api/test endpoint hit ---")
    return {"message": "CORS test successful!"}

@app.get("/api/redis-health")
def redis_health_check():
    client = RedisClient.get_client()
    if client:
        try:
            client.ping()
            return {"status": "healthy", "message": "Redis is connected"}
        except Exception as e:
            return {"status": "unhealthy", "message": str(e)}
    else:
        return {"status": "unhealthy", "message": "Redis client not initialized"}

@app.post("/api/company-info")
def receive_company_info(company_info: CompanyInfo):
    return validate_and_save_company_information(company_info)


@app.post("/api/appointments")
def receive_appointments(appointments: List[Appointment]):
    return validate_appointments(appointments)

@app.post("/api/distance-matrix")
def full_matrix(payload: DistanceMatrixRequest):
    try:
        return get_distance_matrix_with_cache(payload.locations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/enhance-opti-request")
def full_matrix(request:OptimizationRequest):
    try:
        return check_and_enhance_optimization_request(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/solve-without-check")
def full_matrix(request:EnhancedOptimizationRequest):
    try:
        return solve_appointment_routing(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/check-and-solve")
def check_and_solve(request: OptimizationRequest):
    try:
        enh =  check_and_enhance_optimization_request(request)
        return solve_appointment_routing(enh)
    except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/testdata/optimization-request")
def get_testdata_optimization_request(request:TestdataRequest):
    try:
        opti_request = create_testdata_optimization_request(
            num_vehicles = request.number_of_vehicles,
            num_appointments = request.number_of_appointments,
            appointment_duration_factor= request.appointment_duration_factor
        )
        return opti_request
    except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)
