#!/bin/bash
# Verify test database credentials are set up correctly

echo "🔍 Verifying test database setup..."
echo ""

# Check if .env.test exists
if [ ! -f .env.test ]; then
  echo "❌ .env.test not found!"
  echo ""
  echo "To set up test database:"
  echo "1. Create a Supabase project at https://supabase.com"
  echo "2. Create .env.test file with:"
  echo ""
  echo "   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
  echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
  echo "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
  echo ""
  exit 1
fi

echo "✅ .env.test found"

# Check if required variables are set
if grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.test && \
   grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.test && \
   grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env.test; then
  echo "✅ All required environment variables are set"
  echo ""
  echo "✅ Test database is configured correctly!"
  echo ""
  echo "You can now run:"
  echo "  npm run test:e2e          # Run all E2E tests"
  echo "  npm run test:e2e:ui       # Run tests in UI mode"
  echo "  npm run test:e2e:headed   # Show browser while testing"
else
  echo "❌ Missing some environment variables in .env.test"
  echo ""
  echo "Make sure .env.test contains:"
  echo "  - NEXT_PUBLIC_SUPABASE_URL"
  echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi
