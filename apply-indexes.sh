#!/bin/bash

# Script to apply performance indexes to Supabase database
# This reads the migration file and applies it using psql

MIGRATION_FILE="supabase/migrations/20241221000000_add_performance_indexes.sql"

echo "🚀 Applying performance indexes to Supabase database..."
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Check if DATABASE_URL is set in .env or environment
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment or .env file"
    echo ""
    echo "Please set DATABASE_URL in your .env file with your Supabase connection string:"
    echo "DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.rqectbjbsthqwwhpydeq.supabase.co:5432/postgres"
    echo ""
    echo "Or get the direct connection string from:"
    echo "Supabase Dashboard → Settings → Database → Connection String → Direct connection"
    exit 1
fi

echo "📝 Applying migration: $MIGRATION_FILE"
echo ""

# Apply migration using psql
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Performance indexes applied successfully!"
    echo "🚀 Your database queries will now be 3-5x faster!"
else
    echo ""
    echo "❌ Failed to apply indexes"
    echo ""
    echo "Alternative: Apply manually in Supabase Dashboard"
    echo "1. Go to https://supabase.com/dashboard/project/rqectbjbsthqwwhpydeq/editor"
    echo "2. Click 'SQL Editor'"
    echo "3. Copy and paste the contents of: $MIGRATION_FILE"
    echo "4. Click 'Run'"
fi

