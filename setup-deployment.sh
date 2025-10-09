#!/bin/bash

echo "🚀 MaturAIze Deployment Setup"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ Please run this script from the root directory of the MaturAIze project"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install frontend dependencies
if [ -d "frontend" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Install backend dependencies
if [ -d "backend" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

echo "✅ Dependencies installed successfully!"
echo ""
echo "🔧 Next steps for deployment (Vercel):"
echo ""

echo "1. Frontend (Next.js on Vercel):"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Select 'frontend' as root directory"
echo "   - Set environment variable: NEXT_PUBLIC_API_URL"

echo ""
echo "2. Backend (Node/Express on Vercel):"
echo "   - Create a new Vercel project and set Root Directory to 'backend'"
echo "   - Framework Preset: Other"
echo "   - Build Command: npm run build (or leave empty)"
echo "   - Install Command: npm install"
echo "   - Environment variables: DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL, PORT=4000"

echo ""
echo "3. Database (Neon):"
echo "   - Go to https://neon.tech"
echo "   - Create a new database"
echo "   - Copy the connection string"

echo ""
echo "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Happy deploying!"
