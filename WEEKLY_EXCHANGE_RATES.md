# Weekly Exchange Rates Implementation

## Overview

This implementation adds weekly exchange rate management functionality to the GBR application, allowing users to set exchange rates for entire weeks instead of daily rates.

## Changes Made

### Database Schema Changes

- Added `WeeklyPrice` model to `prisma/schema.prisma`
- Added `WeeklyPriceType` enum with COMMODITY and EXCHANGE values
- Added relationships to `Exchange` and `Commodity` models
- Added unique constraints to prevent duplicate rates for the same week

### API Routes

- Created `/api/weekly-prices` route for CRUD operations on weekly prices
- Created `/api/weekly-prices/[id]` route for individual price operations
- Implemented week boundary calculations and validation

### Frontend Components

- Created `/setup/weekly-exchange` page for managing weekly exchange rates
- Added week selection with automatic Monday calculation
- Implemented weekly rate display and management
- Added proper modal confirmations for delete operations

### Utility Functions

- Created `app/lib/week-utils.ts` with utility functions for:
  - Week start/end calculations
  - Week display formatting
  - Week comparison functions
  - ISO week number calculation

### Navigation Updates

- Added "Manage Weekly Exchange Rates" option to setup page
- Updated imports to include Calendar icon

## Features

### Week Management

- Automatic calculation of week boundaries (Monday to Sunday)
- Week display in "Jan 1 - Jan 7, 2024" format
- Current week default selection
- Date picker automatically adjusts to Monday of selected week

### Rate Management

- Create weekly exchange rates with validation
- Edit existing rates with week period updates
- Delete rates with confirmation modal
- View rate details in modal
- Filter by exchange and week
- Pagination for large datasets

### Data Validation

- Prevents duplicate rates for the same week and exchange
- Validates required fields (exchange, rate, week)
- Proper error handling and user feedback

## Database Structure

### WeeklyPrice Model

```prisma
model WeeklyPrice {
  id            String          @id @default(uuid())
  type          WeeklyPriceType
  commodityId   String?         // Only for type COMMODITY
  commodity     Commodity?      @relation(fields: [commodityId], references: [id])
  exchangeId    String?         // Only for type EXCHANGE
  exchange      Exchange?       @relation(fields: [exchangeId], references: [id])
  price         Float
  weekStartDate DateTime        // Start of the week (Monday)
  weekEndDate   DateTime        // End of the week (Sunday)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@unique([type, commodityId, weekStartDate], name: "unique_weekly_commodity_price")
  @@unique([type, exchangeId, weekStartDate], name: "unique_weekly_exchange_rate")
}
```

## API Endpoints

### GET /api/weekly-prices

- Query parameters: `type`, `itemId`, `week`
- Returns: Array of weekly prices with exchange/commodity data

### POST /api/weekly-prices

- Body: `{ type, itemId, price, weekStartDate? }`
- Creates new weekly price entry
- Validates uniqueness for the week

### GET /api/weekly-prices/[id]

- Returns: Single weekly price with related data

### PUT /api/weekly-prices/[id]

- Body: `{ price, weekStartDate? }`
- Updates existing weekly price

### DELETE /api/weekly-prices/[id]

- Deletes weekly price entry

## Usage

1. Navigate to Setup → Manage Weekly Exchange Rates
2. Select an exchange from the dropdown
3. Enter the exchange rate
4. Select or adjust the week (defaults to current week)
5. Click "Add Rate" to save
6. View, edit, or delete existing rates using the action buttons
7. Use filters to find specific rates by exchange or week

## Migration Notes

- This implementation adds weekly functionality alongside existing daily rates
- No existing data is affected
- Both daily and weekly rates can coexist
- Future migration from daily to weekly rates can be implemented if needed

## Technical Notes

- Week calculations use Monday as the first day of the week
- All date/time operations are timezone-aware
- Unique constraints prevent data duplication
- Proper error handling for edge cases
- Responsive design for mobile compatibility
