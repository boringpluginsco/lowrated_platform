#!/bin/bash

# B2B Business Listings - Coolify Deployment Script
# This script helps prepare and verify the deployment

set -e

echo "🚀 B2B Business Listings - Coolify Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required files exist
echo "📋 Checking required files..."

required_files=(
    "Dockerfile"
    "backend/Dockerfile"
    "docker-compose.yml"
    "nginx.conf"
    "package.json"
    "backend/package.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found $file"
    else
        print_error "Missing $file"
        exit 1
    fi
done

# Check if environment files exist
echo ""
echo "🔧 Checking environment configuration..."

if [ -f "env.example" ]; then
    print_status "Frontend env.example found"
else
    print_warning "Frontend env.example not found"
fi

if [ -f "backend/env.example" ]; then
    print_status "Backend env.example found"
else
    print_warning "Backend env.example not found"
fi

# Check git status
echo ""
echo "📦 Checking git status..."

if git diff --quiet && git diff --cached --quiet; then
    print_status "Working directory is clean"
else
    print_warning "You have uncommitted changes"
    echo "Consider committing your changes before deployment:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for deployment'"
    echo "  git push origin main"
fi

# Check current branch
current_branch=$(git branch --show-current)
if [ "$current_branch" = "main" ]; then
    print_status "Currently on main branch"
else
    print_warning "Not on main branch (currently on $current_branch)"
fi

# Display deployment information
echo ""
echo "📋 Deployment Information"
echo "========================"
echo "Frontend Port: 80"
echo "Backend Port: 3001"
echo "Frontend Dockerfile: ./Dockerfile"
echo "Backend Dockerfile: ./backend/Dockerfile"

echo ""
echo "🔧 Required Environment Variables"
echo "================================"
echo ""
echo "Frontend:"
echo "  VITE_API_URL=https://api.yourdomain.com"
echo ""
echo "Backend:"
echo "  PORT=3001"
echo "  NODE_ENV=production"
echo "  RESEND_API_KEY=re_your_resend_api_key"
echo "  FROM_EMAIL=jordan@galleongroup.co"
echo "  GOOGLE_SERVICE_ACCOUNT_KEY={\"type\":\"service_account\",...}"
echo "  GOOGLE_SHEET_ID=your_sheet_id"

echo ""
echo "🌐 DNS Configuration"
echo "==================="
echo "Create these DNS records pointing to your Coolify server:"
echo "  Type: A, Name: api, Value: [Your Coolify Server IP]"
echo "  Type: A, Name: @, Value: [Your Coolify Server IP]"

echo ""
echo "📚 Next Steps"
echo "============="
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. In Coolify Dashboard:"
echo "   - Deploy Backend service first"
echo "   - Deploy Frontend service second"
echo "   - Configure environment variables"
echo "   - Set up domains and SSL"
echo ""
echo "3. Test the deployment:"
echo "   curl https://api.yourdomain.com/api/health"
echo "   curl https://yourdomain.com/health"
echo ""
echo "4. Configure external services:"
echo "   - Set up Resend email service"
echo "   - Configure Google Sheets integration"
echo "   - Set up ImprovMX (optional)"

echo ""
print_status "Deployment preparation complete!"
echo ""
echo "📖 For detailed instructions, see: COOLIFY_DEPLOYMENT.md" 