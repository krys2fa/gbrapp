# Arkesel SMS Configuration Guide

## Overview
The GBR application has been configured to use Arkesel SMS service for sending SMS notifications in the exchange rate approval system.

## Configuration Steps

### 1. Get Your Arkesel API Key
1. Sign up for an Arkesel account at [https://arkesel.com](https://arkesel.com)
2. Navigate to your dashboard
3. Go to **API Settings** or **Developers** section
4. Copy your API key

### 2. Update Environment Variables
Add your Arkesel API key to the `.env` file:

```env
# SMS Configuration (Arkesel)
SMS_API_KEY=your_actual_arkesel_api_key_here
```

**Replace** `your_actual_arkesel_api_key_here` with your real Arkesel API key.

### 3. Configure Sender ID (Optional)
In the code, the sender ID is set to "GBR-APP". You can change this in:
- File: `lib/notification-service.ts`
- Line: `sender: "GBR-APP"`
- Requirements: Maximum 11 characters, alphanumeric only

### 4. Phone Number Format
The system automatically handles phone number formatting:
- Accepts numbers with or without the `+` prefix
- Converts to international format for Arkesel
- Example: `+233241234567` or `233241234567`

## Arkesel API Integration Details

### Endpoint Used
```
https://sms.arkesel.com/api/v2/sms/send
```

### Request Format
```json
{
  "sender": "GBR-APP",
  "message": "Your SMS message content",
  "recipients": ["233262134710"]
}
```

### Headers
```
Content-Type: application/json
api-key: your_arkesel_api_key
```

### Success Response
```json
{
  "code": "ok",
  "message": "SMS sent successfully",
  "data": {
    "balance": "remaining_balance",
    "cost": "message_cost",
    "recipients": 1
  }
}
```

## Testing SMS Functionality

### 1. Test User Setup
Make sure your test users have:
- `phone` field populated with valid phone numbers
- `smsNotifications` set to `true`
- Appropriate roles (SUPERADMIN, CEO, DEPUTY_CEO)

### 2. Test Exchange Rate Creation
1. Create a new exchange rate via the API
2. Check console logs for SMS sending attempts
3. Verify SMS delivery to test phone numbers

### 3. Test Delayed Notifications
1. Create an exchange rate
2. Wait 5 minutes without approving
3. Check that delayed SMS is sent to DEPUTY_CEO and SUPERADMIN

## Troubleshooting

### Common Issues

#### 1. "SMS service not configured"
- **Cause**: Missing `SMS_API_KEY` in environment variables
- **Solution**: Add your Arkesel API key to `.env` file

#### 2. SMS sending fails with 401 error
- **Cause**: Invalid API key
- **Solution**: Verify your API key is correct and active

#### 3. SMS sending fails with 400 error
- **Cause**: Invalid phone number format or sender ID
- **Solution**: Check phone numbers are in international format without special characters

#### 4. Users not receiving SMS
- **Cause**: User doesn't have phone number or SMS notifications disabled
- **Solution**: Update user records with valid phone numbers and enable SMS notifications

### Debug Logging
The system provides detailed logging:
```
SMS TO: +233241234567, MESSAGE: Exchange rate approval required...
SMS sent successfully to +233241234567
```

## Cost Considerations
- Each SMS costs credits from your Arkesel account
- Monitor your balance to ensure continuous service
- Consider implementing rate limiting for high-volume scenarios

## Security Notes
- Keep your API key secure and never commit it to version control
- Use environment variables for all sensitive configuration
- Consider rotating API keys periodically

## Phone Number Database Requirements

### User Table Requirements
Users who should receive SMS notifications must have:
```sql
phone VARCHAR(20) -- International format phone number
smsNotifications BOOLEAN DEFAULT true -- Enable SMS notifications
```

### Example User Records
```sql
-- Super Admin
UPDATE users SET 
  phone = '+233558252455, 
  smsNotifications = true 
WHERE role = 'SUPERADMIN';

-- CEO
UPDATE users SET 
  phone = '+233262134710', 
  smsNotifications = true 
WHERE role = 'CEO';

-- Deputy CEO
UPDATE users SET 
  phone = '+233262134710', 
  smsNotifications = true 
WHERE role = 'DEPUTY_CEO';
```

## Production Deployment
1. Ensure production environment has the `SMS_API_KEY` set
2. Test with a small group before full deployment
3. Monitor SMS delivery rates and costs
4. Set up alerting for SMS failures

## Support
- Arkesel Documentation: https://developers.arkesel.com
- Arkesel Support: Available through their dashboard