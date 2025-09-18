# PowerShell script to deploy migrations to production
# This script uses environment variables instead of hardcoded credentials

# Check if production database URL is set in environment
if (-not $env:PRODUCTION_DATABASE_URL) {
    Write-Host "❌ Error: PRODUCTION_DATABASE_URL environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set the environment variable before running this script:" -ForegroundColor Yellow
    Write-Host '  $env:PRODUCTION_DATABASE_URL = "your-production-database-url"' -ForegroundColor Yellow
    exit 1
}

# Temporarily set DATABASE_URL to production for migration deployment
$originalDatabaseUrl = $env:DATABASE_URL
$env:DATABASE_URL = $env:PRODUCTION_DATABASE_URL

Write-Host "🚀 Deploying migrations to production database..." -ForegroundColor Green
Write-Host "Using database: $($env:PRODUCTION_DATABASE_URL.Split('@')[1].Split('/')[0])" -ForegroundColor Cyan

try {
    # Deploy migrations
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration deployment completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration deployment failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error occurred during migration deployment: $_" -ForegroundColor Red
    exit 1
} finally {
    # Restore original DATABASE_URL
    if ($originalDatabaseUrl) {
        $env:DATABASE_URL = $originalDatabaseUrl
        Write-Host "🔄 Restored original DATABASE_URL" -ForegroundColor Yellow
    }
}

Write-Host "🎉 Production migration deployment completed!" -ForegroundColor Green