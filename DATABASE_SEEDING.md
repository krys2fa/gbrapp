# 🌱 Database Seeding Guide

## Overview

This guide covers the different methods available for seeding your production database with initial data.

## ⚠️ Important Notes

- **Vercel does NOT automatically run seeds** - this is intentional for safety
- **Production seeding should only be done once** per database
- **Always backup before seeding** (Neon handles this automatically)
- **Change default passwords** after seeding production

## 🛠️ Available Seeding Methods

### Method 1: Automated Script (Recommended)

**File**: `scripts/seed-production.js`

```powershell
# Run the automated seeding script
npm run seed:production
```

**What it does:**

1. ✅ Backs up your current `.env` file
2. 🔄 Switches `DATABASE_URL` to production temporarily
3. 🌱 Runs the seed command
4. 🔄 Restores your development database connection
5. 🧹 Cleans up backup files

**Benefits:**

- Safe and automated
- No manual file editing
- Automatic rollback on errors
- Confirmation prompt

### Method 2: API Endpoint Seeding

**File**: `app/api/admin/seed/route.ts`

```bash
# After your app is deployed to Vercel
curl -X POST https://your-app.vercel.app/api/admin/seed \
  -H "Authorization: Bearer your-secret-key"
```

**Benefits:**

- Can be done remotely
- No local database switching
- Built-in safety checks
- Returns detailed response

**Security:**

- Update the authorization bearer token in the API file
- Consider adding IP restrictions
- Remove or secure this endpoint after use

### Method 3: One-time Deployment Seeding

**Temporarily modify** `package.json`:

```json
{
  "scripts": {
    "vercel-build": "npx prisma migrate deploy && npx prisma db seed && next build"
  }
}
```

**Steps:**

1. Change the `vercel-build` script as shown above
2. Deploy to Vercel (seeding will run automatically)
3. **Important**: Change the script back to remove seeding:
   ```json
   "vercel-build": "npx prisma migrate deploy && next build"
   ```
4. Deploy again to update the build script

### Method 4: Environment-based Seeding

**File**: `scripts/conditional-seed.js`

1. **Set Vercel environment variable**: `SHOULD_SEED=true`
2. **Update vercel-build script**:
   ```json
   "vercel-build": "npx prisma migrate deploy && npm run conditional-seed && next build"
   ```
3. **Deploy once**, then remove the environment variable

## 📋 Default Seed Data

Your seed file creates:

- **System User**: For audit trails (`system@gbrapp.com`)
- **Admin User**: Default admin (`admin@gbrapp.com` / `admin123`)
- **Standard User**: Regular user account
- **Commodities**: Gold, Silver, etc.
- **Exchanges**: USD/GHS, etc.
- **Default Settings**: Fees, types, etc.

## 🔒 Post-Seeding Security Steps

After seeding production:

1. **Login to your app** with admin credentials
2. **Change default passwords** immediately:
   - `admin@gbrapp.com` (password: `admin123`)
   - Any other default accounts
3. **Verify all data** looks correct
4. **Test key functionality**
5. **Remove/secure seeding endpoints** if used

## 🚨 Troubleshooting

### Script Fails

- Check that `PRODUCTION_DATABASE_URL` exists in `.env`
- Verify database connection strings are correct
- Ensure production database is accessible

### Permission Errors

- Verify database user has CREATE/INSERT permissions
- Check if database already has data (seed might conflict)

### Rollback if Needed

```powershell
# If seeding fails, your .env is automatically restored
# If you need to clear production database:
# (Use with EXTREME caution)

# 1. Switch to production database temporarily
# 2. Reset database
npx prisma migrate reset --force
# 3. Re-apply migrations
npx prisma migrate deploy
# 4. Switch back to development
```

## 📝 Best Practices

1. **Test seeding in development first**
2. **Use the automated script** for safety
3. **Seed only once per environment**
4. **Monitor database after seeding**
5. **Document any custom seed data**
6. **Keep seed files updated** with schema changes

## 🎯 Recommended Workflow

For your first production seeding:

1. **Deploy your app** to Vercel (without seeding)
2. **Verify the app works** (may show empty data)
3. **Run seeding**: `npm run seed:production`
4. **Test your app** with the seed data
5. **Change default passwords**
6. **You're ready to go!** 🚀
