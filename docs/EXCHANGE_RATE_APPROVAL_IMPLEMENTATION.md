# Exchange Rate Approval System Implementation

## Overview
Updated the exchange rate approval system to implement role-based permissions and timed SMS notifications as requested.

## Changes Made

### 1. Updated Role-Based Permissions
- **File**: `app/api/weekly-prices/[id]/approve/route.ts`
- **Change**: Modified approval endpoint to restrict access to only SUPERADMIN, CEO, and DEPUTY_CEO roles
- **Previous**: Allowed SUPERADMIN and ADMIN roles
- **Current**: Only SUPERADMIN, CEO, and DEPUTY_CEO can approve/reject exchange rates

### 2. Enhanced Notification Service
- **File**: `lib/notification-service.ts`
- **Added**: `notifyUsersWithRoles()` method for role-based SMS/email notifications
- **Added**: `notifyExchangeRateApprovalDelayed()` method for urgent delayed notifications
- **Updated**: `notifyExchangeRateApproval()` to send immediate SMS to SUPERADMIN and CEO

### 3. Implemented Notification Scheduler
- **File**: `lib/notification-scheduler.ts` (New)
- **Features**:
  - Schedule delayed notifications using setTimeout
  - Cancel scheduled notifications when exchange rates are processed
  - In-memory storage of scheduled notifications
  - Automatic cleanup when notifications are sent or cancelled

### 4. Updated Exchange Rate Creation Flow
- **File**: `app/api/weekly-prices/route.ts`
- **Changes**:
  - Immediate SMS notification to SUPERADMIN and CEO when exchange rate is added
  - Schedule 5-minute delayed notification to DEPUTY_CEO and SUPERADMIN
  - Integration with notification scheduler

### 5. Updated Exchange Rate Approval Flow
- **File**: `app/api/weekly-prices/[id]/approve/route.ts`
- **Changes**:
  - Cancel scheduled notifications when exchange rate is approved/rejected
  - Prevent duplicate notifications

## Workflow

### When Exchange Rate is Added:
1. **Immediate Action**: SMS sent to SUPERADMIN and CEO
2. **Scheduled Action**: 5-minute delayed SMS scheduled for DEPUTY_CEO and SUPERADMIN

### When Exchange Rate is Approved/Rejected:
1. **Immediate Action**: Scheduled delayed notification is cancelled
2. **Notification**: Standard approval/rejection notification sent

### If Exchange Rate Remains Pending After 5 Minutes:
1. **Automatic Action**: URGENT SMS sent to DEPUTY_CEO and SUPERADMIN
2. **Message**: Includes "URGENT" prefix and emphasizes immediate attention needed

## Technical Details

### Role Hierarchy for Approvals:
- **SUPERADMIN**: Can approve/reject, receives immediate and delayed notifications
- **CEO**: Can approve/reject, receives immediate notifications
- **DEPUTY_CEO**: Can approve/reject, receives delayed notifications only

### Notification Types:
- **Immediate SMS**: Sent when exchange rate is created
- **Delayed SMS**: Sent after 5 minutes if still pending
- **Approval SMS**: Sent when approved/rejected (existing functionality)

### Database Schema:
- User model already includes `phone` field for SMS notifications
- User model includes `smsNotifications` boolean preference
- WeeklyPrice model supports the approval workflow

## Environment Variables Required:
```env
SMS_SERVICE_URL=your_sms_service_endpoint
SMS_API_KEY=your_sms_api_key
```

## Testing Considerations:
1. Verify role permissions work correctly
2. Test immediate SMS notifications are sent
3. Test delayed notifications trigger after 5 minutes
4. Test scheduled notifications are cancelled on approval/rejection
5. Verify only users with phone numbers receive SMS notifications

## Notes:
- Notification scheduling is in-memory (will reset on server restart)
- For production, consider using a persistent job queue (Redis, database-based)
- SMS service integration depends on external provider configuration
- Graceful fallback to logging when SMS service is not configured