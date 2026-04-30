#!/bin/bash
set -e
echo "⚡ TaskFlow Setup"

echo "→ Installing backend dependencies..."
cd backend && npm install && cd ..

echo "→ Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "✅ Done! Next steps:"
echo ""
echo "1. Set up backend .env:"
echo "   cp backend/.env.example backend/.env"
echo "   # Edit backend/.env with your MongoDB URI and JWT secret"
echo ""
echo "2. Seed demo data:"
echo "   cd backend && npm run seed"
echo ""
echo "3. Start backend (port 5000):"
echo "   cd backend && npm run dev"
echo ""
echo "4. Start frontend (port 3000) in a new terminal:"
echo "   cp frontend/.env.example frontend/.env"
echo "   cd frontend && npm start"
echo ""
echo "Demo accounts after seeding:"
echo "  Admin:  alice@demo.com / admin123"
echo "  Member: bob@demo.com   / member123"
