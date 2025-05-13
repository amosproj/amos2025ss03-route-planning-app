#!/bin/bash

cd "$(dirname "$0")"

# Create and activate virtual environment
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Load environment variables from .env if exists
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Kill any existing uvicorn process
pkill -f "uvicorn" || true

# Start FastAPI app from app.py
nohup venv/bin/uvicorn app:app --host 0.0.0.0 --port 8080 > log.txt 2>&1 &
