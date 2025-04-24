// frontend/src/types.ts
export interface VRPNode {
    id: number;
    x: number;
    y: number;
    is_depot: boolean;
    time_window?: [number, number] | null;
    required_skills?: string[];
  }
  
  export type VehicleSkills = {
    [key: string]: string[]; 
  };
  
  export interface ScenarioData {
    nodes: VRPNode[];
    num_vehicles: number;
    available_skills: string[];
    vehicle_skills: VehicleSkills;
  }
  
  export type Route = number[];
  
  export interface SolverResult {
    status: "success" | "error";
    routes?: Route[];
    max_distance?: number;
    total_distance?: number;
    message?: string; 
  }