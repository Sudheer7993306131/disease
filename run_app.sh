#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "============================================================"
echo "    MediCURE v2.0 AI Disease Prediction & Home Remedies    "
echo "        FastAPI (Backend) + React TypeScript (Frontend)     "
echo "============================================================"

# Start Backend
echo "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..."
cd "$DIR/backend"
"$DIR/backend/venv/bin/uvicorn" main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "[2/2] Starting React Vite Frontend on http://localhost:5173 ..."
cd "$DIR/frontend"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

trap "echo 'Stopping MediCURE services...'; kill $BACKEND_PID $FRONTEND_PID" EXIT

echo ""
echo " MediCURE AI is live!"
echo " Frontend: http://localhost:5173"
echo " Backend API & Swagger Docs: http://localhost:8000/docs"
echo " Press Ctrl+C to stop both servers."
echo ""

wait
