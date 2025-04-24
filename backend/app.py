# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from solver import solve_vrp

app = Flask(__name__)
# Configure CORS for development (allow requests from React dev server)
# For production, restrict the origin more specifically
CORS(app)

@app.route('/api/test', methods=['GET'])
def handle_test():
    print("--- /api/test endpoint hit ---") 
    return jsonify({"message": "CORS test successful!"}), 200


@app.route('/api/solve', methods=['POST'])
def handle_solve():
    if not request.is_json:
        return jsonify({"status": "error", "message": "Request must be JSON"}), 400

    data = request.get_json()

    if not data or 'nodes' not in data or 'num_vehicles' not in data:
         return jsonify({"status": "error", "message": "Missing required data: nodes, num_vehicles"}), 400

    result = solve_vrp(data)

    status_code = 200 if result.get("status") == "success" else 400 if result.get("status") == "error" else 500
    return jsonify(result), status_code

if __name__ == '__main__':
    app.run(debug=True, port=5002)