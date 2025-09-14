#!/bin/bash

# SwiftGuard SBOM Generation Script
# Generates Software Bill of Materials for security compliance

set -e

echo "🔍 Generating SwiftGuard SBOM..."

# Create security directory if it doesn't exist
mkdir -p security/sbom

# Install cyclonedx if not present
if ! command -v cyclonedx-bom &> /dev/null; then
    echo "📦 Installing CycloneDX CLI..."
    npm install -g @cyclonedx/cyclonedx-npm
fi

# Generate JSON SBOM
echo "📋 Generating JSON SBOM..."
cyclonedx-bom -o security/sbom/swiftguard-sbom.json

# Generate XML SBOM
echo "📋 Generating XML SBOM..."
cyclonedx-bom -o security/sbom/swiftguard-sbom.xml -t xml

# Validate SBOM
echo "✅ Validating SBOM..."
cyclonedx-bom validate -i security/sbom/swiftguard-sbom.json

# Generate summary
echo "📊 SBOM Summary:"
echo "  - JSON: security/sbom/swiftguard-sbom.json"
echo "  - XML: security/sbom/swiftguard-sbom.xml"
echo "  - Generated: $(date)"
echo "  - Components: $(jq '.components | length' security/sbom/swiftguard-sbom.json)"

echo "✅ SBOM generation complete!"

