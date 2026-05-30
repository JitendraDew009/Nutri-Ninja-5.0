# Nutri Ninja - Automated Build Setup Script
# Run this script in the project root directory
# Usage: bash build-setup.sh

set -e  # Exit on error

echo "================================"
echo "🥷 Nutri Ninja Build Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "${YELLOW}[1/5] Checking prerequisites...${NC}"
echo ""

if ! command -v node &> /dev/null; then
    echo "${RED}✗ Node.js not found. Please install Node.js v18+${NC}"
    exit 1
fi
echo "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v python3 &> /dev/null; then
    echo "${RED}✗ Python not found. Please install Python 3.9+${NC}"
    exit 1
fi
echo "${GREEN}✓ Python $(python3 --version)${NC}"

npm_version=$(npm -v)
echo "${GREEN}✓ npm $npm_version${NC}"
echo ""

# Setup Frontend
echo "${YELLOW}[2/5] Setting up Frontend...${NC}"
cd frontend
echo "Installing dependencies..."
npm install
echo "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..
echo ""

# Setup Backend - Create Virtual Environment
echo "${YELLOW}[3/5] Setting up Backend Python environment...${NC}"
cd backend

# Check if venv already exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "${GREEN}✓ Virtual environment created${NC}"
else
    echo "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
source venv/bin/activate
echo "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Install Python dependencies
echo "${YELLOW}[4/5] Installing Backend dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt
echo "${GREEN}✓ Backend dependencies installed${NC}"
cd ..
echo ""

# Summary
echo "${YELLOW}[5/5] Build setup complete!${NC}"
echo ""
echo "================================"
echo "🚀 Next Steps:"
echo "================================"
echo ""
echo "1. Start Backend (from project root):"
echo "   cd backend"
echo "   source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
echo "   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
echo ""
echo "2. In another terminal, start Frontend:"
echo "   cd frontend"
echo "   npm run web"
echo ""
echo "3. Access the application:"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Frontend Web: http://localhost:8081"
echo ""
echo "================================"
echo "${GREEN}Build setup completed successfully!${NC}"
echo "================================"
