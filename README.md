# GBR App - Gold Buying and Refining Management System

A comprehensive web application for managing gold buying and refining operations, built with Next.js, TypeScript, Prisma, and PostgreSQL.

> **Latest Update**: Security enhanced - all deployment scripts now use environment variables for credentials.

## 🚀 Features

- **Job Card Management**: Create, view, edit, and manage job cards for gold transactions
- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Exporter Management**: Manage exporters and exporter types
- **Shipment Tracking**: Track different types of shipments
- **Assay Management**: Record and manage gold assay results
- **Invoice Generation**: Create and manage invoices for transactions
- **Audit Trail**: Complete audit logging for all system actions
- **Real-time Updates**: Live updates and notifications
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.2, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with bcryptjs
- **Styling**: Tailwind CSS, Heroicons
- **Forms**: React Select for enhanced form components
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+
- npm, yarn, pnpm, or bun
- PostgreSQL database
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gbrapp
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gbrapp?schema=public"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secure-jwt-secret-key-here"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Optional: Environment
NODE_ENV="development"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database with initial data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

### Core Models

#### JobCard

Central entity for managing gold transactions with fields for:

- Reference number and received date
- Exporter and shipment information
- Buyer details (ID, name, phone)
- Gold specifications (weight, fineness, price)
- Processing details (team leader, destination country)
- Financial information (USD/GHS values)
- Status tracking and notes

#### User Management

- **User**: System users with role-based access
- **Role**: SUPERADMIN, ADMIN, USER

#### Business Entities

- **Exporter**: Companies/individuals exporting gold
- **ExporterType**: Categories of exporters
- **ShipmentType**: Different shipment categories

#### Processing Entities

- **Assay**: Gold purity and composition results
- **Seal**: Security seals for shipments
- **Invoice**: Financial documentation
- **Fee & Levy**: Associated charges

#### Personnel

- **CustomsOfficer**: Customs department officials
- **NACOBOfficer**: NACOB department officials
- **NationalSecurityOfficer**: Security officials
- **AssayOfficer**: Assay specialists
- **TechnicalDirector**: Technical oversight

### Key Enums

- **IdType**: PASSPORT, GHANA_CARD, DRIVERS_LICENSE, TIN
- **SealType**: CUSTOMS_SEAL, PMMC_SEAL, OTHER_SEAL
- **FeeType**: ASSAY_FEE, WHT_FEE
- **ActionType**: CREATE, UPDATE, DELETE, VIEW, APPROVE, REJECT, OTHER

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:seed      # Seed database with initial data
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
```

## 🔒 Authentication & Authorization

The application uses JWT-based authentication with three user roles:

- **SUPERADMIN**: Full system access
- **ADMIN**: Administrative functions
- **USER**: Basic operations

Protected routes are secured using middleware and role-based access control.

## 📁 Project Structure

```
gbrapp/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── job-cards/     # Job card CRUD operations
│   │   ├── exporters/     # Exporter management
│   │   └── ...            # Other API endpoints
│   ├── job-cards/         # Job card pages
│   ├── lib/               # Utility functions and middleware
│   ├── components/        # Reusable UI components
│   └── globals.css        # Global styles
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Prisma schema definition
│   └── seed.ts           # Database seeding script
├── public/                # Static assets
├── middleware.ts          # Next.js middleware
└── package.json           # Dependencies and scripts
```

## 🔄 API Endpoints

### Job Cards

- `GET /api/job-cards` - List all job cards
  - Optional query: `hasAssays=true` to return only job cards that have at least one assay (useful for the Valuations page). When `hasAssays=true` the endpoint will include `assays` in the returned job card objects and results are ordered by latest assay date.
- `POST /api/job-cards` - Create new job card
- `GET /api/job-cards/[id]` - Get specific job card
- `PUT /api/job-cards/[id]` - Update job card
- `DELETE /api/job-cards/[id]` - Delete job card

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/validate` - Validate JWT token

### Reference Data

- `GET /api/exporters` - List exporters
- `GET /api/exporter-types` - List exporter types
- `GET /api/shipment-types` - List shipment types

### Daily Prices & Exchange Rates (auto-fetch)

- `GET /api/daily-prices` - List daily prices. Optional query params:

  - `type=COMMODITY|EXCHANGE` - filter by price type.
  - `itemId=<id>` - when provided with `type=COMMODITY` or `type=EXCHANGE` the server will return prices for that item.

- Auto-fetch behavior:
  - When a client requests commodity prices for a specific commodity (GET `/api/daily-prices?type=COMMODITY&itemId=<commodityId>`) and no price exists for the current day, the server will attempt to fetch a spot price from a free external provider and persist it as a `DailyPrice` record, then return the updated list.
  - When a client requests exchange rates (GET `/api/daily-prices?type=EXCHANGE&itemId=<exchangeId>`) and no rate exists for the current day, the server will attempt to fetch the USD->target currency rate (preferring the Bank of Ghana page where applicable) and persist it as a `DailyPrice` record, then return the updated list.
  - If the request omits `itemId`, the server will try to fetch today's price/rate for all commodities/exchanges that lack a price for today.

Notes:

- Default providers:
  - Commodities: `https://api.metals.live/v1/spot` (primary), `https://data-asg.goldprice.org/dbXRates/USD` (fallback).
  - Exchange rates: Bank of Ghana page (primary attempt via HTML parse), `https://api.exchangerate.host` (fallback).
- Persisted prices are rounded to 2 decimal places before saving.
- These external requests are performed server-side; they require outgoing network access from your deployment environment.
- If you prefer a different provider (or an API key-based service), update `app/lib/external-prices.ts` and `app/lib/external-exchange.ts` to call the provider and store the result. You can store API keys in environment variables and use them inside these helpers.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms

Ensure your hosting platform supports:

- Node.js 18+
- PostgreSQL database
- Environment variables
- Build command: `npm run build`
- Start command: `npm run start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:

- Review the documentation
- Check existing issues
- Create a new issue for bugs or feature requests

## 🔄 Version History

- **0.1.0** - Initial release with core job card management functionality

---

Built with ❤️ using Next.js and TypeScript

## 🛡️ Production Migrations (safe deploy)

When deploying to production (Vercel or other hosts) you must apply Prisma migrations to keep the database schema in sync with `prisma/schema.prisma`.

Recommended steps (PowerShell examples):

1. Create a backup/snapshot of your production database (critical):

```powershell
# Replace with your production DATABASE_URL
$prodUrl = "<PROD_DB_URL>"
pg_dump $prodUrl -Fc -f "prod-backup-$(Get-Date -Format yyyyMMddHHmmss).dump"
```

2. Deploy migrations:

```powershell
# Ensure DATABASE_URL and NODE_ENV are set for production context
$env:DATABASE_URL = "<PROD_DB_URL>"
$env:NODE_ENV = "production"

# Apply all pending migrations
npx prisma migrate deploy --schema=prisma/schema.prisma
```

3. Verify the migration succeeded (example check for `exporterPricePerOz` column):

```powershell
psql $prodUrl -c "SELECT column_name FROM information_schema.columns WHERE table_name='\"JobCard\"' AND column_name='exporterPricePerOz';"
```

Vercel tip: to ensure migrations run during deployment, either add the `vercel-build` script (already included) which runs `npx prisma migrate deploy && next build`, or add a CI step to run `npx prisma migrate deploy` prior to deploying.

Rollback: If something goes wrong, restore the backup created above using `pg_restore` or your provider snapshot restore functionality.
