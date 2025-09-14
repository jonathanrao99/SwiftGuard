#!/bin/bash

# SwiftGuard Production Safeguards Script
# Ensures production readiness and prevents common issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "FAIL")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "ℹ️  $message"
            ;;
    esac
}

echo "🔒 SwiftGuard Production Safeguards"
echo "=================================="

# Check 1: No test functions in production
print_status "INFO" "Checking for test functions in production..."

if find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .git | xargs grep -l "list-guards\|create-test-accounts" 2>/dev/null; then
    print_status "FAIL" "Test functions found in production code"
    exit 1
else
    print_status "PASS" "No test functions in production code"
fi

# Check 2: No hardcoded secrets
print_status "INFO" "Checking for hardcoded secrets..."

if grep -r "sk_live_\|eyJ.*\." . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.yml" 2>/dev/null; then
    print_status "FAIL" "Hardcoded secrets found in code"
    exit 1
else
    print_status "PASS" "No hardcoded secrets found"
fi

# Check 3: No console.log in production
print_status "INFO" "Checking for console.log statements..."

if grep -r "console\.log" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.yml" 2>/dev/null; then
    print_status "WARN" "console.log statements found in production code"
else
    print_status "PASS" "No console.log statements found"
fi

# Check 4: No TODO/FIXME in production
print_status "INFO" "Checking for TODO/FIXME comments..."

if grep -r "TODO\|FIXME" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.yml" 2>/dev/null; then
    print_status "WARN" "TODO/FIXME comments found in production code"
else
    print_status "PASS" "No TODO/FIXME comments found"
fi

# Check 5: Environment variables are set
print_status "INFO" "Checking environment variables..."

required_vars=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "SENTRY_DSN"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    print_status "PASS" "All required environment variables are set"
else
    print_status "FAIL" "Missing environment variables: ${missing_vars[*]}"
    exit 1
fi

# Check 6: No test users in production
print_status "INFO" "Checking for test users in production..."

if grep -r "test.*user\|demo.*user" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.yml" 2>/dev/null; then
    print_status "WARN" "Test user references found in production code"
else
    print_status "PASS" "No test user references found"
fi

# Check 7: Database migrations are up to date
print_status "INFO" "Checking database migrations..."

if [ -d "supabase/migrations" ]; then
    migration_count=$(find supabase/migrations -name "*.sql" | wc -l)
    print_status "INFO" "Found $migration_count database migrations"
    
    # Check for migration naming convention
    if find supabase/migrations -name "*.sql" | grep -v "^[0-9]\{14\}_.*\.sql$"; then
        print_status "WARN" "Some migrations don't follow naming convention (YYYYMMDDHHMMSS_description.sql)"
    else
        print_status "PASS" "All migrations follow naming convention"
    fi
else
    print_status "WARN" "No migrations directory found"
fi

# Check 8: Edge functions are properly configured
print_status "INFO" "Checking edge functions..."

if [ -d "supabase/functions" ]; then
    function_count=$(find supabase/functions -name "index.ts" | wc -l)
    print_status "INFO" "Found $function_count edge functions"
    
    # Check for proper function structure
    for func in supabase/functions/*/index.ts; do
        if [ -f "$func" ]; then
            if ! grep -q "serve(" "$func"; then
                print_status "WARN" "Function $(dirname "$func") may not be properly configured"
            fi
        fi
    done
else
    print_status "WARN" "No edge functions directory found"
fi

# Check 9: Security configurations
print_status "INFO" "Checking security configurations..."

# Check for RLS policies
if [ -f "supabase/migrations" ]; then
    if find supabase/migrations -name "*.sql" | xargs grep -l "ROW LEVEL SECURITY\|RLS" 2>/dev/null; then
        print_status "PASS" "RLS policies found in migrations"
    else
        print_status "WARN" "No RLS policies found in migrations"
    fi
fi

# Check 10: App configuration
print_status "INFO" "Checking app configuration..."

if [ -f "app.json" ]; then
    if grep -q "NSLocationWhenInUseUsageDescription" app.json; then
        print_status "PASS" "Location permissions configured"
    else
        print_status "WARN" "Location permissions not configured"
    fi
else
    print_status "FAIL" "app.json not found"
    exit 1
fi

# Check 11: Package.json scripts
print_status "INFO" "Checking package.json scripts..."

if [ -f "package.json" ]; then
    if grep -q "build\|test\|lint" package.json; then
        print_status "PASS" "Required scripts found in package.json"
    else
        print_status "WARN" "Some required scripts missing from package.json"
    fi
else
    print_status "FAIL" "package.json not found"
    exit 1
fi

# Check 12: Documentation
print_status "INFO" "Checking documentation..."

required_docs=(
    "README.md"
    "docs/RUNBOOK.md"
    "docs/BACKUP_DISASTER_RECOVERY.md"
    "docs/WEBHOOK_RUNBOOK.md"
    "docs/store_checklist.md"
)

missing_docs=()
for doc in "${required_docs[@]}"; do
    if [ ! -f "$doc" ]; then
        missing_docs+=("$doc")
    fi
done

if [ ${#missing_docs[@]} -eq 0 ]; then
    print_status "PASS" "All required documentation found"
else
    print_status "WARN" "Missing documentation: ${missing_docs[*]}"
fi

# Final summary
echo ""
echo "🎯 Production Safeguards Summary"
echo "================================"
print_status "INFO" "Production safeguards check completed"
print_status "INFO" "Review any warnings above before deploying to production"

echo ""
echo "📋 Pre-deployment Checklist:"
echo "  □ All tests passing"
echo "  □ Security audit clean"
echo "  □ No hardcoded secrets"
echo "  □ Environment variables configured"
echo "  □ Database migrations applied"
echo "  □ Edge functions deployed"
echo "  □ Documentation updated"
echo "  □ App Store assets ready"
echo "  □ Privacy policy updated"
echo "  □ Terms of service updated"

echo ""
print_status "INFO" "Ready for production deployment! 🚀"




