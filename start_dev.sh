#!/bin/bash

echo "🚀 Starting AgentHive Development Environment..."

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found!"
    echo "📝 Please create backend/.env from backend/.env.example"
    echo "   cd backend && cp .env.example .env"
    echo "   Then add your OPENAI_API_KEY to the .env file"
    exit 1
fi

echo "✅ Backend .env file found"

# Setup virtual environment for backend
echo "🔧 Setting up Python virtual environment..."
cd backend

# Check if virtual environment already exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    
    # Try uv first (faster), fallback to python venv
    if command -v uv &> /dev/null; then
        echo "🚀 Using uv for virtual environment..."
        uv venv
        if [ $? -eq 0 ]; then
            echo "✅ uv virtual environment created"
        else
            echo "⚠️  uv failed, falling back to python venv..."
            python3 -m venv .venv
        fi
    else
        echo "📦 Using python venv..."
        python3 -m venv .venv
    fi
    
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

# Install/update dependencies
echo "📚 Installing Python dependencies..."
if command -v uv &> /dev/null && [ -f ".venv/pyvenv.cfg" ]; then
    echo "🚀 Using uv pip for faster installation..."
    uv pip install -r requirements.txt
else
    echo "📦 Using pip..."
    pip install -r requirements.txt
fi

echo "✅ Dependencies installed"

# Start backend
echo "📡 Starting backend server..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "🌐 Backend started (PID: $BACKEND_PID)"
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Test backend health
echo "🏥 Testing backend health..."
curl -s http://localhost:8000/v1/agents/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend health check failed (might still be starting up)"
fi

# Start frontend with correct API URL
echo "🎨 Starting frontend..."
cd ../frontend
VITE_API_BASE_URL=http://localhost:8000 npm run dev &
FRONTEND_PID=$!

echo "✨ Frontend started (PID: $FRONTEND_PID)"
echo ""
echo "🎯 AgentHive is running:"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo "   Health:   http://localhost:8000/v1/agents/health"
echo "   Sessions: http://localhost:8000/v1/sessions"
echo ""
echo "📝 Virtual environment: backend/.venv"
echo "🔑 API Base URL: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Stopped successfully"
    echo "💡 To reactivate venv later: cd backend && source .venv/bin/activate"
    exit 0
}

# Set trap to cleanup on interrupt
trap cleanup INT

# Wait for interrupt
wait
