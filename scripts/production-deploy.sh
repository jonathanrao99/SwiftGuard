#!/bin/bash

# SwiftGuard Production Deployment Script
# This script handles safe deployment to production

set -e  # Exit on any error

echo "🚀 Starting SwiftGuard Production Deployment..."

# Color codes for output
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

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_error "Deployment must be done from main branch. Current: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Check environment variables
print_status "Checking environment variables..."
required_vars=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "STRIPE_PUBLISHABLE_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Environment variable $var is not set"
        exit 1
    fi
done

# Run tests
print_status "Running tests..."
npm run test || {
    print_error "Tests failed. Deployment aborted."
    exit 1
}

# Type check
print_status "Running TypeScript type check..."
npm run type-check || {
    print_error "TypeScript errors found. Deployment aborted."
    exit 1
}

# Lint check
print_status "Running linter..."
npm run lint || {
    print_error "Linting errors found. Deployment aborted."
    exit 1
}

# Security audit
print_status "Running security audit..."
npm audit --audit-level=high || {
    print_warning "Security vulnerabilities found. Review before continuing."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

# Build the app
print_status "Building application..."
npx expo build:web --prod || {
    print_error "Build failed. Deployment aborted."
    exit 1
}

# Run production checks
print_status "Running production checks..."
node scripts/test-app.js || {
    print_warning "Some production checks failed. Review the report."
}

# Deploy to EAS
print_status "Deploying to EAS..."
npx eas update --branch production --message "Production deployment $(date)" || {
    print_error "EAS deployment failed."
    exit 1
}

# Tag the release
VERSION=$(cat package.json | grep version | cut -d '"' -f 4)
git tag -a "v$VERSION" -m "Production release v$VERSION"
git push origin "v$VERSION"

print_status "Deployment completed successfully!"
print_status "Version: v$VERSION"
print_status "Branch: $CURRENT_BRANCH"
print_status "Timestamp: $(date)"

echo ""
print_warning "Post-deployment checklist:"
echo "  - Monitor error rates in Sentry"
echo "  - Check app store reviews"
echo "  - Verify payment processing"
echo "  - Test critical user flows"
echo "  - Monitor server performance"
