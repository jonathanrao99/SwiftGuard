#!/bin/bash

# SwiftGuard Security Audit Script
# Runs comprehensive security checks

set -e

echo "🔒 Starting SwiftGuard Security Audit..."

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

# Create security directory
mkdir -p security/audits

echo "📋 Running dependency audit..."
if npm audit --production --audit-level=moderate > security/audits/npm-audit.txt 2>&1; then
    print_status "PASS" "NPM audit passed"
else
    print_status "FAIL" "NPM audit found vulnerabilities"
    echo "Check security/audits/npm-audit.txt for details"
fi

echo "🔍 Running OSV scanner..."
if command -v osv-scanner &> /dev/null; then
    if osv-scanner -r . > security/audits/osv-scan.txt 2>&1; then
        print_status "PASS" "OSV scanner passed"
    else
        print_status "WARN" "OSV scanner found issues"
        echo "Check security/audits/osv-scan.txt for details"
    fi
else
    print_status "INFO" "OSV scanner not installed, skipping"
    echo "Install with: go install github.com/google/osv-scanner/cmd/osv-scanner@latest"
fi

echo "🔐 Checking for secrets..."
if command -v gitleaks &> /dev/null; then
    if gitleaks detect --source . --config .gitleaks.toml --report-format json --report-path security/audits/gitleaks-report.json; then
        print_status "PASS" "No secrets detected"
    else
        print_status "FAIL" "Secrets detected in codebase"
        echo "Check security/audits/gitleaks-report.json for details"
    fi
else
    print_status "INFO" "Gitleaks not installed, skipping"
    echo "Install with: https://github.com/gitleaks/gitleaks#installation"
fi

echo "🔍 Checking for service role keys in client code..."
if grep -r "service_role\|eyJ.*\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=dist . | grep -v "test\|spec\|example" > security/audits/service-role-check.txt; then
    print_status "FAIL" "Service role keys found in client code"
    echo "Check security/audits/service-role-check.txt for details"
else
    print_status "PASS" "No service role keys in client code"
fi

echo "📊 Generating security report..."
cat > security/audits/security-report.md << EOF
# SwiftGuard Security Audit Report

**Generated:** $(date)
**Auditor:** Security Audit Script
**Version:** 1.0.0

## Summary

| Check | Status | Details |
|-------|--------|---------|
| NPM Audit | $(if [ -f security/audits/npm-audit.txt ] && grep -q "found 0 vulnerabilities" security/audits/npm-audit.txt; then echo "✅ PASS"; else echo "❌ FAIL"; fi) | Check npm-audit.txt |
| OSV Scanner | $(if [ -f security/audits/osv-scan.txt ] && ! grep -q "VULNERABILITIES FOUND" security/audits/osv-scan.txt; then echo "✅ PASS"; else echo "⚠️  WARN"; fi) | Check osv-scan.txt |
| Gitleaks | $(if [ -f security/audits/gitleaks-report.json ] && [ $(jq '.findings | length' security/audits/gitleaks-report.json 2>/dev/null || echo 0) -eq 0 ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi) | Check gitleaks-report.json |
| Service Role Check | $(if [ -f security/audits/service-role-check.txt ] && [ ! -s security/audits/service-role-check.txt ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi) | Check service-role-check.txt |

## Recommendations

1. **Regular Audits**: Run this script weekly
2. **Dependency Updates**: Keep dependencies updated
3. **Secret Management**: Use environment variables for secrets
4. **Code Review**: Review all changes for security issues

## Files Generated

- \`security/audits/npm-audit.txt\` - NPM audit results
- \`security/audits/osv-scan.txt\` - OSV scanner results  
- \`security/audits/gitleaks-report.json\` - Gitleaks findings
- \`security/audits/service-role-check.txt\` - Service role key check
- \`security/audits/security-report.md\` - This report

EOF

print_status "INFO" "Security audit complete"
echo "📄 Report saved to: security/audits/security-report.md"





