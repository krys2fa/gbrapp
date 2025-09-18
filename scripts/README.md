# Secure Production Deployment Scripts

This directory contains secure scripts for deploying migrations to production that use environment variables instead of hardcoded credentials.

## Available Scripts

### PowerShell Script (Windows)

- **File**: `deploy-production-migrations.ps1`
- **Platform**: Windows PowerShell

### Shell Script (Unix/Linux/macOS)

- **File**: `deploy-production-migrations.sh`
- **Platform**: Unix/Linux/macOS

## Usage

### 1. Set Environment Variable

Before running either script, set the production database URL as an environment variable:

#### PowerShell (Windows):

```powershell
$env:PRODUCTION_DATABASE_URL = "postgresql://username:password@host:port/database?sslmode=require"
```

#### Bash/Shell (Unix/Linux/macOS):

```bash
export PRODUCTION_DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### 2. Run the Script

#### PowerShell:

```powershell
.\scripts\deploy-production-migrations.ps1
```

#### Shell:

```bash
chmod +x ./scripts/deploy-production-migrations.sh
./scripts/deploy-production-migrations.sh
```

## Security Features

- ✅ No hardcoded credentials in scripts
- ✅ Environment variable validation
- ✅ Automatic restoration of original DATABASE_URL
- ✅ Error handling and informative messages
- ✅ Safe to commit to version control

## Notes

- The scripts temporarily override the `DATABASE_URL` environment variable for the migration deployment
- Original `DATABASE_URL` is automatically restored after deployment
- Scripts will fail fast if `PRODUCTION_DATABASE_URL` is not set
- Both scripts provide colored output for better visibility

## Example Usage with Neon Database

```powershell
# Set your Neon production database URL
$env:PRODUCTION_DATABASE_URL = "postgresql://neondb_owner:your_password@ep-your-endpoint.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Run migration deployment
.\scripts\deploy-production-migrations.ps1
```

This approach ensures that sensitive database credentials are never committed to the repository while still providing a convenient way to deploy migrations to production.
