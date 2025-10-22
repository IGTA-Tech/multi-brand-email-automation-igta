#!/bin/bash

# Multi-Brand Email Automation System - Production Deployment Script
# This script automates the deployment process for the tracking server and validates configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Header
echo ""
echo "=========================================="
echo "  Email Automation Deployment Script"
echo "=========================================="
echo ""

# Step 1: Check Prerequisites
print_info "Checking prerequisites..."

MISSING_DEPS=0

if ! command_exists node; then
    print_error "Node.js is not installed"
    MISSING_DEPS=1
else
    NODE_VERSION=$(node -v)
    print_success "Node.js installed: $NODE_VERSION"
fi

if ! command_exists npm; then
    print_error "npm is not installed"
    MISSING_DEPS=1
else
    NPM_VERSION=$(npm -v)
    print_success "npm installed: $NPM_VERSION"
fi

if ! command_exists git; then
    print_warning "git is not installed (optional)"
else
    print_success "git installed"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Missing required dependencies. Please install them first."
    exit 1
fi

# Step 2: Check Environment Configuration
print_info "Checking environment configuration..."

if [ ! -f "tracking-server/.env" ]; then
    print_error "tracking-server/.env file not found!"
    print_info "Creating from template..."

    if [ -f "tracking-server/.env.example" ]; then
        cp tracking-server/.env.example tracking-server/.env
        print_warning "Created .env file from template. Please edit it with your actual values."
        print_warning "Run: nano tracking-server/.env"
        exit 1
    else
        print_error "tracking-server/.env.example not found!"
        exit 1
    fi
else
    print_success "Environment file exists"
fi

# Step 3: Validate Environment Variables
print_info "Validating environment variables..."

source tracking-server/.env

VALIDATION_FAILED=0

if [ -z "$N8N_BASE_URL" ] || [ "$N8N_BASE_URL" == "https://your-n8n-instance.app.n8n.cloud" ]; then
    print_error "N8N_BASE_URL not configured in .env"
    VALIDATION_FAILED=1
fi

if [ -z "$WEBHOOK_SECRET" ] || [ "$WEBHOOK_SECRET" == "your-random-secure-string" ]; then
    print_error "WEBHOOK_SECRET not configured in .env"
    VALIDATION_FAILED=1
fi

if [ $VALIDATION_FAILED -eq 1 ]; then
    print_error "Environment validation failed. Please configure tracking-server/.env"
    exit 1
fi

print_success "Environment variables validated"

# Step 4: Install Tracking Server Dependencies
print_info "Installing tracking server dependencies..."

cd tracking-server

if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

print_success "Dependencies installed"

# Step 5: Test Tracking Server
print_info "Testing tracking server..."

# Start server in background
NODE_ENV=production node src/server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Tracking server is healthy"
    kill $SERVER_PID
else
    print_error "Tracking server health check failed"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

cd ..

# Step 6: Choose Deployment Method
print_info "Select deployment method:"
echo "  1) PM2 (Process Manager)"
echo "  2) Docker"
echo "  3) systemd service"
echo "  4) Manual (just install, don't start)"
read -p "Enter choice [1-4]: " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        print_info "Deploying with PM2..."

        if ! command_exists pm2; then
            print_info "Installing PM2 globally..."
            npm install -g pm2
        fi

        cd tracking-server

        # Stop existing instance if running
        pm2 stop email-tracking 2>/dev/null || true
        pm2 delete email-tracking 2>/dev/null || true

        # Start with PM2
        pm2 start src/server.js --name email-tracking
        pm2 save

        # Setup startup script
        print_info "Setting up PM2 to start on boot..."
        pm2 startup

        print_success "Deployed with PM2"
        print_info "Useful PM2 commands:"
        echo "  pm2 status           - Check status"
        echo "  pm2 logs email-tracking - View logs"
        echo "  pm2 restart email-tracking - Restart server"
        echo "  pm2 stop email-tracking - Stop server"

        cd ..
        ;;

    2)
        print_info "Deploying with Docker..."

        if ! command_exists docker; then
            print_error "Docker is not installed"
            exit 1
        fi

        # Build Docker image
        docker build -t email-tracking-server ./tracking-server

        # Stop and remove existing container
        docker stop email-tracking 2>/dev/null || true
        docker rm email-tracking 2>/dev/null || true

        # Run container
        docker run -d \
            --name email-tracking \
            --restart unless-stopped \
            -p 3000:3000 \
            --env-file tracking-server/.env \
            email-tracking-server

        print_success "Deployed with Docker"
        print_info "Useful Docker commands:"
        echo "  docker logs email-tracking - View logs"
        echo "  docker restart email-tracking - Restart"
        echo "  docker stop email-tracking - Stop"
        ;;

    3)
        print_info "Creating systemd service..."

        WORK_DIR=$(pwd)

        # Create service file
        sudo tee /etc/systemd/system/email-tracking.service > /dev/null <<EOF
[Unit]
Description=Email Tracking Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$WORK_DIR/tracking-server
EnvironmentFile=$WORK_DIR/tracking-server/.env
ExecStart=$(which node) $WORK_DIR/tracking-server/src/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

        # Reload systemd
        sudo systemctl daemon-reload

        # Enable and start service
        sudo systemctl enable email-tracking
        sudo systemctl start email-tracking

        print_success "Deployed as systemd service"
        print_info "Useful systemd commands:"
        echo "  sudo systemctl status email-tracking - Check status"
        echo "  sudo journalctl -u email-tracking -f - View logs"
        echo "  sudo systemctl restart email-tracking - Restart"
        echo "  sudo systemctl stop email-tracking - Stop"
        ;;

    4)
        print_success "Installation complete. Server not started."
        print_info "To start manually: cd tracking-server && npm start"
        ;;

    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Step 7: Firewall Configuration
print_info "Checking firewall configuration..."

if command_exists ufw; then
    print_warning "UFW firewall detected"
    read -p "Allow port 3000 through firewall? [y/N]: " ALLOW_FIREWALL

    if [ "$ALLOW_FIREWALL" == "y" ] || [ "$ALLOW_FIREWALL" == "Y" ]; then
        sudo ufw allow 3000/tcp
        print_success "Port 3000 allowed through firewall"
    fi
fi

# Step 8: SSL/TLS Recommendation
print_warning "IMPORTANT: Set up SSL/TLS for production!"
print_info "Recommended: Use Nginx as reverse proxy with Let's Encrypt"
echo ""
print_info "Quick Nginx setup:"
echo "  1. sudo apt install nginx certbot python3-certbot-nginx"
echo "  2. sudo nano /etc/nginx/sites-available/tracking"
echo "  3. Add reverse proxy config (see docs/DEPLOYMENT.md)"
echo "  4. sudo certbot --nginx -d your-tracking-domain.com"
echo ""

# Step 9: Final Validation
print_info "Performing final validation..."

sleep 2

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Server is running and healthy!"
else
    print_warning "Server may not be running. Check logs."
fi

# Step 10: Next Steps
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
print_success "Tracking Server Status: DEPLOYED"
echo ""
print_info "Next Steps:"
echo "  1. Set up Nginx reverse proxy with SSL"
echo "  2. Configure n8n workflows"
echo "  3. Set up Google Sheets and Airtable"
echo "  4. Import n8n workflows from n8n-workflows/"
echo "  5. Configure Lido automations"
echo "  6. Test with a sample campaign"
echo ""
print_info "Documentation:"
echo "  - QUICKSTART.md - Quick setup guide"
echo "  - docs/WORKFLOWS.md - Workflow setup"
echo "  - docs/DEPLOYMENT.md - Full deployment guide"
echo ""
print_info "Validation:"
echo "  Run: ./scripts/validate-deployment.sh"
echo ""
