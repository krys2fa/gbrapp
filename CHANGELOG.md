# Changelog

All notable changes to the GBR App project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-08-27

### Added

- Initial release of GBR App - Gold Buying and Refining Management System
- Complete job card management system with comprehensive form fields
- User authentication with JWT and role-based access control (SUPERADMIN, ADMIN, USER)
- Database schema with full business entity relationships
- API endpoints for job cards, exporters, shipment types, and reference data
- Responsive UI with Tailwind CSS and Heroicons
- Audit trail system for all user actions
- Form validation and error handling
- Country selection with react-select integration

### Database Schema

- **JobCard**: Central entity with 25+ fields including buyer details, gold specifications, financial data
- **User Management**: User authentication with role-based permissions
- **Business Entities**: Exporters, ExporterTypes, ShipmentTypes
- **Processing Entities**: Assays, Seals, Invoices, Fees, Levies
- **Personnel**: Various officer types (Customs, NACOB, Security, Assay, Technical Director)
- **Reference Data**: Currencies, PriceTypes, LevyTypes, InvoiceTypes

### Key Features

- Dynamic job card forms with consistent styling
- Real-time form validation
- Secure API routes with middleware protection
- Comprehensive audit logging
- Database seeding with essential reference data
- Environment configuration support

### Technical Stack

- Next.js 15.5.2 with App Router
- React 19 with TypeScript
- Prisma ORM with PostgreSQL
- JWT authentication with bcryptjs
- Tailwind CSS for styling
- React Select for enhanced form components

### Fixed

- Dynamic route parameter handling in Next.js App Router
- API endpoint error handling and validation
- Database update operations for job cards
- Form field styling consistency
- Runtime error handling with proper null checks

### Removed

- Dummy test data from database seeding
- Placeholder content from README
- Development-only test job cards and related entities

### Development Setup

- Comprehensive README with setup instructions
- Environment configuration template (.env.example)
- Clean database seeding script with essential data only
- TypeScript configuration and linting setup

### Security

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Secure password hashing with bcryptjs
- Protected API routes with middleware

---

## Version History Notes

This project follows semantic versioning:

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backwards compatible manner
- **PATCH** version for backwards compatible bug fixes

Each release includes database migrations and deployment instructions where applicable.
