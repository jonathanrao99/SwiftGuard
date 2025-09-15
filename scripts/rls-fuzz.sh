#!/bin/bash

# SwiftGuard RLS Fuzz Testing Script
# Tests Row-Level Security policies for cross-tenant access prevention

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Configuration
SUPABASE_PROJECT_URL=${SUPABASE_PROJECT_URL:-"https://tidzeckbgcyxyzihbdun.supabase.co"}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-""}

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    print_status "FAIL" "SUPABASE_SERVICE_ROLE_KEY environment variable is required"
    exit 1
fi

echo "🔒 Starting SwiftGuard RLS Fuzz Testing..."
echo "📊 Project: $SUPABASE_PROJECT_URL"

# Create results directory
mkdir -p security/audits/rls-fuzz
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="security/audits/rls-fuzz/rls-fuzz-results-$TIMESTAMP.json"

# Function to run SQL via Supabase
run_sql() {
    local sql="$1"
    local description="$2"
    
    print_status "INFO" "Running: $description"
    
    # Use curl to execute SQL via Supabase REST API
    local response=$(curl -s -X POST \
        "$SUPABASE_PROJECT_URL/rest/v1/rpc/exec_sql" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"sql\": \"$sql\"}")
    
    echo "$response"
}

# Function to run fuzz tests
run_fuzz_tests() {
    print_status "INFO" "Setting up test data..."
    
    # Setup test data
    run_sql "$(cat security/rls_fuzz.sql)" "Setup RLS fuzz test data"
    
    print_status "INFO" "Running RLS fuzz tests..."
    
    # Run all fuzz tests
    local test_results=$(run_sql "SELECT * FROM security.run_all_rls_fuzz_tests();" "Run all RLS fuzz tests")
    
    # Parse and display results
    echo "$test_results" | jq -r '.[] | "\(.table_name) | \(.test_name) | Expected: \(.expected_result) | Actual: \(.actual_result) | \(if .passed then "✅ PASS" else "❌ FAIL" end)"'
    
    # Save results to file
    echo "$test_results" > "$RESULTS_FILE"
    
    # Count results
    local total_tests=$(echo "$test_results" | jq 'length')
    local passed_tests=$(echo "$test_results" | jq '[.[] | select(.passed == true)] | length')
    local failed_tests=$((total_tests - passed_tests))
    
    print_status "INFO" "Test Results Summary:"
    echo "  Total Tests: $total_tests"
    echo "  Passed: $passed_tests"
    echo "  Failed: $failed_tests"
    echo "  Results saved to: $RESULTS_FILE"
    
    if [ $failed_tests -eq 0 ]; then
        print_status "PASS" "All RLS fuzz tests passed!"
        return 0
    else
        print_status "FAIL" "$failed_tests RLS fuzz tests failed!"
        return 1
    fi
}

# Function to cleanup test data
cleanup_test_data() {
    print_status "INFO" "Cleaning up test data..."
    run_sql "SELECT security.cleanup_rls_fuzz_test_data();" "Cleanup RLS fuzz test data"
    print_status "PASS" "Test data cleaned up"
}

# Function to test JWT token validation
test_jwt_validation() {
    print_status "INFO" "Testing JWT token validation..."
    
    # Test with invalid JWT
    local invalid_jwt="invalid.jwt.token"
    local response=$(curl -s -X GET \
        "$SUPABASE_PROJECT_URL/rest/v1/users" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $invalid_jwt" \
        -H "Content-Type: application/json")
    
    if echo "$response" | jq -e '.code' > /dev/null; then
        print_status "PASS" "Invalid JWT properly rejected"
    else
        print_status "FAIL" "Invalid JWT was not properly rejected"
    fi
    
    # Test with expired JWT (if we had one)
    print_status "INFO" "JWT validation test completed"
}

# Function to test rate limiting
test_rate_limiting() {
    print_status "INFO" "Testing rate limiting..."
    
    # Make multiple rapid requests to test rate limiting
    local rate_limit_triggered=false
    for i in {1..10}; do
        local response=$(curl -s -X POST \
            "$SUPABASE_PROJECT_URL/functions/v1/list-guards" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            -d '{"limit": 1}' \
            -w "%{http_code}")
        
        local http_code="${response: -3}"
        if [ "$http_code" = "429" ]; then
            rate_limit_triggered=true
            break
        fi
        
        sleep 0.1
    done
    
    if [ "$rate_limit_triggered" = true ]; then
        print_status "PASS" "Rate limiting is working"
    else
        print_status "WARN" "Rate limiting may not be working (no 429 responses)"
    fi
}

# Main execution
main() {
    echo "🚀 SwiftGuard RLS Fuzz Testing Suite"
    echo "======================================"
    
    # Check prerequisites
    if ! command -v jq &> /dev/null; then
        print_status "FAIL" "jq is required but not installed"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_status "FAIL" "curl is required but not installed"
        exit 1
    fi
    
    # Run tests
    local exit_code=0
    
    # Test JWT validation
    test_jwt_validation || exit_code=1
    
    # Test rate limiting
    test_rate_limiting || exit_code=1
    
    # Run RLS fuzz tests
    if run_fuzz_tests; then
        print_status "PASS" "RLS fuzz testing completed successfully"
    else
        print_status "FAIL" "RLS fuzz testing failed"
        exit_code=1
    fi
    
    # Cleanup
    cleanup_test_data
    
    # Generate report
    cat > "security/audits/rls-fuzz/rls-fuzz-report-$TIMESTAMP.md" << EOF
# SwiftGuard RLS Fuzz Test Report

**Generated:** $(date)
**Project:** $SUPABASE_PROJECT_URL
**Results File:** $RESULTS_FILE

## Summary

$(if [ $exit_code -eq 0 ]; then echo "✅ All tests passed"; else echo "❌ Some tests failed"; fi)

## Test Results

$(echo "$test_results" | jq -r '.[] | "- **\(.table_name)**: \(.test_name) - \(if .passed then "✅ PASS" else "❌ FAIL" end)"')

## Recommendations

1. **Regular Testing**: Run RLS fuzz tests weekly
2. **Policy Review**: Review RLS policies after schema changes
3. **Access Monitoring**: Monitor for unusual access patterns
4. **Security Updates**: Keep Supabase and dependencies updated

EOF
    
    print_status "INFO" "Report saved to: security/audits/rls-fuzz/rls-fuzz-report-$TIMESTAMP.md"
    
    exit $exit_code
}

# Run main function
main "$@"





