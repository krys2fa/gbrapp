#!/bin/bash
# Shell script to deploy migrations to production
# This script uses environment variables instead of hardcoded credentials

# Check if production database URL is set in environment
if [[ -z "$PRODUCTION_DATABASE_URL" ]]; then
    echo "❌ Error: PRODUCTION_DATABASE_URL environment variable is not set!"
    echo "Please set the environment variable before running this script:"
    echo '  export PRODUCTION_DATABASE_URL="your-production-database-url"'
    exit 1
fi

# Temporarily set DATABASE_URL to production for migration deployment
ORIGINAL_DATABASE_URL="$DATABASE_URL"
export DATABASE_URL="$PRODUCTION_DATABASE_URL"

echo "🚀 Deploying migrations to production database..."
echo "Using database: $(echo $PRODUCTION_DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1)"

# Deploy migrations
if npx prisma migrate deploy; then
    echo "✅ Migration deployment completed successfully!"
else
    echo "❌ Migration deployment failed!"
    # Restore original DATABASE_URL before exiting
    if [[ -n "$ORIGINAL_DATABASE_URL" ]]; then
        export DATABASE_URL="$ORIGINAL_DATABASE_URL"
    fi
    exit 1
fi

# Restore original DATABASE_URL
if [[ -n "$ORIGINAL_DATABASE_URL" ]]; then
    export DATABASE_URL="$ORIGINAL_DATABASE_URL"
    echo "🔄 Restored original DATABASE_URL"
fi

echo "🎉 Production migration deployment completed!"