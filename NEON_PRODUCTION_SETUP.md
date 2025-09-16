# Neon Database Setup: Development and Production Environments

## Overview

This guide provides a comprehensive setup for managing separate Neon databases for development and production environments. This approach ensures complete isolation between test data and live production data.

## Current Setup Assessment

You already have:

- ✅ Development database on Neon (with test data)
- ❌ Production database on Neon (needs to be created)

## Step 1: Create Production Database on Neon

### 1.1 Access Neon Console

1. Log into your [Neon Console](https://console.neon.tech)
2. You'll see your existing development project

### 1.2 Create New Project for Production

1. Click **Create Project** (or **+ New Project**)
2. Configure the production database:
   ```
   Project Name: gbrapp-production
   Region: Same as development (for consistency)
   PostgreSQL Version: Same as development
   ```

### 1.3 Set Up Production Database

1. **Database Name**: `gbrapp_prod` (or similar)
2. **Owner**: Keep default or set to your production user
3. **Compute Size**: Choose based on expected production load
   - Start with: **0.25 vCPU, 1 GB RAM**
   - Enable **Auto-scaling** for production
4. **Storage**: Start with adequate space for your data

### 1.4 Configure Production Settings

```yaml
# Production Database Settings
Compute Size: 0.25 vCPU - 1 GB RAM (scale as needed)
Auto-scaling: Enabled
Maintenance Window: 02:00-04:00 UTC (off-peak)
Backup Retention: 30 days
Point-in-time Recovery: Enabled
```

## Step 2: Database Schema Management

### 2.1 Set Up Schema Migration Strategy

Since you have an existing development database with schema, you need to:

1. **Export Development Schema** (without data):

   ```bash
   # Connect to development database
   pg_dump --schema-only --no-owner --no-privileges \
           "postgresql://user:pass@dev-host/dev-db" > schema.sql
   ```

2. **Import Schema to Production**:
   ```bash
   # Connect to production database
   psql "postgresql://user:pass@prod-host/prod-db" < schema.sql
   ```

### 2.2 Alternative: Use Prisma Migrations

If you're using Prisma, you can apply migrations to production:

```bash
# Generate and apply migrations to production
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

## Step 3: Environment Configuration

### 3.1 Update Environment Variables

Create separate environment files for each environment:

```bash
# .env.development
DATABASE_URL="postgresql://user:pass@dev-host/gbrapp_dev?sslmode=require"
NODE_ENV="development"

# .env.production
DATABASE_URL="postgresql://user:pass@prod-host/gbrapp_prod?sslmode=require"
NODE_ENV="production"
```

### 3.2 Vercel Environment Variables

In your Vercel dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Set up environment-specific variables:

```bash
# Production Environment Variables
DATABASE_URL="postgresql://user:pass@prod-host/gbrapp_prod?sslmode=require"
NODE_ENV="production"
VERCEL_ENV="production"

# Development Environment Variables (if needed)
# These would be for preview deployments
```

### 3.3 Environment Detection in Code

Update your database configuration to handle different environments:

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

## Step 4: Deployment Strategy

### 4.1 Vercel Deployment Configuration

Update your `vercel.json` for environment-specific builds:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 4.2 Environment-Specific Builds

Create scripts in `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "build:dev": "NODE_ENV=development prisma generate && next build",
    "build:prod": "NODE_ENV=production prisma generate && next build",
    "db:migrate:dev": "prisma migrate deploy",
    "db:migrate:prod": "NODE_ENV=production prisma migrate deploy",
    "db:seed:dev": "tsx prisma/seed.ts",
    "db:seed:prod": "NODE_ENV=production tsx prisma/seed.ts"
  }
}
```

## Step 5: Data Management Strategy

### 5.1 Development Data Seeding

Keep your development database populated with test data:

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "development") {
    // Only seed development database
    console.log("🌱 Seeding development database...");

    // Add your test data here
    await prisma.user.createMany({
      data: [
        { name: "Test User 1", email: "test1@example.com" },
        { name: "Test User 2", email: "test2@example.com" },
      ],
    });

    console.log("✅ Development database seeded");
  } else {
    console.log("🚫 Skipping seed for production database");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 5.2 Production Data Handling

For production database:

1. **Initial Setup**: Import essential reference data only
2. **No Test Data**: Never seed fake users, test transactions, etc.
3. **Backup Strategy**: Set up automated backups
4. **Data Retention**: Implement data cleanup policies

### 5.3 Database Migration Scripts

Create migration scripts for production:

```typescript
// scripts/migrate-to-prod.ts
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

async function migrateToProduction() {
  console.log("🚀 Starting production migration...");

  // 1. Run Prisma migrations
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "inherit",
  });

  // 2. Generate Prisma client
  execSync("npx prisma generate", { stdio: "inherit" });

  // 3. Optional: Import reference data
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  try {
    // Import essential reference data (currencies, etc.)
    await importReferenceData(prisma);
    console.log("✅ Production migration completed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function importReferenceData(prisma: PrismaClient) {
  // Import currencies, countries, etc.
  await prisma.currency.createMany({
    data: [
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "GHS", name: "Ghanaian Cedi", symbol: "GHS" },
    ],
    skipDuplicates: true,
  });
}

migrateToProduction();
```

## Step 6: Security Configuration

### 6.1 Database User Management

Create separate users for each environment:

```sql
-- Production Database
CREATE USER gbrapp_prod_user WITH PASSWORD 'secure_prod_password';
GRANT ALL PRIVILEGES ON DATABASE gbrapp_prod TO gbrapp_prod_user;
GRANT ALL ON SCHEMA public TO gbrapp_prod_user;

-- Development Database
CREATE USER gbrapp_dev_user WITH PASSWORD 'secure_dev_password';
GRANT ALL PRIVILEGES ON DATABASE gbrapp_dev TO gbrapp_dev_user;
GRANT ALL ON SCHEMA public TO gbrapp_dev_user;
```

### 6.2 Connection Security

Update connection strings to use specific users:

```bash
# Production
DATABASE_URL="postgresql://gbrapp_prod_user:secure_prod_password@prod-host/gbrapp_prod?sslmode=require"

# Development
DATABASE_URL="postgresql://gbrapp_dev_user:secure_dev_password@dev-host/gbrapp_dev?sslmode=require"
```

### 6.3 Vercel Security

1. **Environment Variable Protection**: Mark sensitive variables as "Secret"
2. **Branch Protection**: Set up protected branches for production deployments
3. **Access Control**: Limit who can deploy to production

## Step 7: Deployment Workflow

### 7.1 Git Branch Strategy

```bash
# Development workflow
git checkout develop
# Make changes
git commit -m "feat: add new feature"
git push origin develop

# Production deployment
git checkout main
git merge develop
git push origin main  # Triggers Vercel production deployment
```

### 7.2 Vercel Deployment Hooks

Set up deployment hooks for database operations:

```typescript
// vercel-deploy-hook.js
const { execSync } = require("child_process");

if (process.env.VERCEL_ENV === "production") {
  console.log("🚀 Running production deployment tasks...");

  try {
    // Run database migrations
    execSync("npm run db:migrate:prod", { stdio: "inherit" });

    // Generate Prisma client
    execSync("npx prisma generate", { stdio: "inherit" });

    console.log("✅ Production deployment tasks completed");
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}
```

## Step 8: Monitoring and Maintenance

### 8.1 Database Monitoring

Set up monitoring for both databases:

```typescript
// app/api/health/database/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Database health check
    const result = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        now() as current_time,
        pg_size_pretty(pg_database_size(current_database())) as database_size
    `;

    return NextResponse.json({
      status: "healthy",
      environment: process.env.NODE_ENV,
      database: result[0],
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

### 8.2 Backup Strategy

1. **Development**: Daily backups (can be less frequent)
2. **Production**:
   - Automated daily backups
   - Point-in-time recovery enabled
   - Cross-region backup replication
   - Backup retention: 30-90 days

### 8.3 Performance Monitoring

Monitor both databases:

- **Development**: Focus on query performance during testing
- **Production**: Monitor real user patterns, response times, error rates

## Step 9: Testing the Setup

### 9.1 Test Development Environment

```bash
# Test development setup
npm run build:dev
npm run db:migrate:dev
npm run db:seed:dev
```

### 9.2 Test Production Environment

```bash
# Test production setup (with production DATABASE_URL)
NODE_ENV=production npm run build:prod
NODE_ENV=production npm run db:migrate:prod
```

### 9.3 Deployment Testing

1. Deploy to Vercel staging/preview
2. Test with production database connection
3. Verify data isolation between environments
4. Test rollback procedures

## Step 10: Emergency Procedures

### 10.1 Database Rollback

```bash
# For production issues
# 1. Stop the application
# 2. Restore from backup
pg_restore --verbose --clean --no-acl --no-owner \
           -h prod-host -U user -d gbrapp_prod backup.sql

# 3. Restart application
```

### 10.2 Environment Switching

Keep environment toggle ready:

```typescript
// Emergency switch to development database
if (process.env.EMERGENCY_MODE === "true") {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DEV;
}
```

## Troubleshooting Common Issues

### Connection Issues

```bash
# Test database connection
psql "postgresql://user:pass@host/db?sslmode=require" -c "SELECT version();"
```

### Migration Issues

```bash
# Reset development database
npx prisma migrate reset --force

# Check migration status
npx prisma migrate status
```

### Environment Variable Issues

```bash
# Check environment variables
echo $DATABASE_URL
echo $NODE_ENV

# Test Prisma connection
npx prisma db push --preview-feature
```

## Summary

This setup provides:

✅ **Complete Isolation**: Development and production data are completely separate  
✅ **Security**: Different users and credentials for each environment  
✅ **Scalability**: Production database can be scaled independently  
✅ **Backup Strategy**: Appropriate backup policies for each environment  
✅ **Deployment Safety**: Automated migration and testing processes

## Quick Start Checklist

- [ ] Create production project on Neon
- [ ] Set up production database with proper sizing
- [ ] Export/import schema from development to production
- [ ] Configure environment variables in Vercel
- [ ] Update Prisma configuration for environment detection
- [ ] Set up deployment scripts and hooks
- [ ] Configure monitoring and alerts
- [ ] Test deployment process
- [ ] Set up backup and recovery procedures

## Additional Resources

- [Neon Documentation](https://neon.tech/docs/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma Environment Configuration](https://www.prisma.io/docs/guides/development-environment/environment-variables)
- [PostgreSQL Backup Strategies](https://www.postgresql.org/docs/current/backup.html)

---

**Last Updated**: September 8, 2025  
**Version**: 1.0  
**Author**: GitHub Copilot
