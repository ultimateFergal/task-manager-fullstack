#!/bin/bash
# Test cleanup function locally before running full test suite

echo "🧪 Testing database cleanup..."
echo ""

# Run a single test to verify cleanup works
npx playwright test e2e/stats.spec.ts --grep "should display stats when tasks exist" --headed

echo ""
echo "✅ If you see '✅ Database cleaned up successfully' in the logs above,"
echo "   the cleanup is working correctly!"
