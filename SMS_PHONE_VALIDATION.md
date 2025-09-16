# SMS Phone Number Validation

## Overview

The GBR application now includes robust phone number validation to ensure SMS notifications are only sent to valid phone numbers. This prevents failed SMS attempts and provides clear feedback about SMS readiness.

## Phone Number Validation Rules

### Valid Phone Number Format

A phone number is considered valid if it meets ALL of these criteria:

1. **Not null/empty**: Must have a value
2. **Length**: Between 10-15 digits (follows E.164 international standard)
3. **Characters**: Only digits (after removing non-digit characters)
4. **Format**: Can include `+`, spaces, dashes, parentheses (automatically cleaned)

### Examples of Valid Phone Numbers:

```
+233241234567     ✅ International format
233241234567      ✅ Without + prefix
+1 555-123-4567   ✅ US format with formatting
+44 20 7123 4567  ✅ UK format with spaces
(555) 123-4567    ✅ US format with parentheses
```

### Examples of Invalid Phone Numbers:

```
123               ❌ Too short (less than 10 digits)
+1234567890123456 ❌ Too long (more than 15 digits)
abc123def         ❌ Contains letters
""                ❌ Empty string
null              ❌ Null value
```

## Implementation Details

### Automatic Validation

- **Before SMS sending**: Every phone number is validated before attempting to send SMS
- **User creation/editing**: Phone numbers are accepted as-is but validated during SMS operations
- **Logging**: Clear console messages indicate validation results

### Validation Process

1. Check if phone number exists and is a string
2. Remove all non-digit characters (`/\D/g`)
3. Validate length (10-15 digits)
4. Validate format (digits only)

### Enhanced Logging

When SMS notifications are triggered, you'll see detailed logs:

```
🔍 Looking for users with roles: SUPERADMIN, CEO
📱 Found 3 users with required roles:
  - John Admin (SUPERADMIN): phone=+233241234567, email=john@example.com
  - Jane CEO (CEO): phone=NO PHONE, email=jane@example.com
  - Bob Deputy (DEPUTY_CEO): phone=invalid123, email=bob@example.com

📱 Sending SMS to John Admin (SUPERADMIN): +233241234567
📱 No phone number for Jane CEO (CEO) - SMS not sent
📱 Invalid phone number for Bob Deputy (DEPUTY_CEO): invalid123 - SMS not sent

📊 SMS Delivery Summary:
  ✅ Valid phone numbers: 1
  ❌ Invalid phone numbers: 1
  📵 No phone numbers: 1
```

## Checking SMS Readiness

### Automated Check Script

Run this command to check SMS readiness for all approval users:

```bash
npm run check-sms
```

This will show:

- All users with approval roles (SUPERADMIN, CEO, DEPUTY_CEO)
- Phone number validation status for each user
- Summary of SMS readiness
- Specific issues that need fixing

### Real-time Checking

When exchange rates are created, the system automatically:

1. Checks SMS readiness for immediate notifications (SUPERADMIN + CEO)
2. Logs readiness statistics in console
3. Only sends SMS to users with valid phone numbers

## Best Practices

### For Administrators

1. **Run SMS check regularly**: `npm run check-sms`
2. **Ensure key users have phones**: SUPERADMIN and CEO should have valid phones
3. **Use international format**: Always use `+` prefix for international numbers
4. **Test notifications**: Create test exchange rates to verify SMS delivery

### For Phone Number Entry

1. **International format recommended**: `+233241234567`
2. **Include country code**: Don't use local format only
3. **Avoid special characters**: While accepted, simpler is better
4. **Verify number**: Test with a small SMS to confirm delivery

### For Troubleshooting

1. **Check console logs**: Look for validation messages
2. **Run readiness check**: Use `npm run check-sms` command
3. **Verify Arkesel account**: Ensure sufficient balance and active API key
4. **Test individual numbers**: Use the test-sms.js script

## Error Handling

### Graceful Degradation

- Invalid phone numbers don't prevent system operation
- Clear logging indicates which users didn't receive SMS
- Email notifications can still work independently
- System continues processing even if SMS fails

### Common Issues and Solutions

| Issue                         | Cause                         | Solution                                   |
| ----------------------------- | ----------------------------- | ------------------------------------------ |
| "Invalid phone number format" | Wrong format/length           | Use international format with country code |
| "No phone number"             | User has no phone in database | Add phone number in user management        |
| "SMS service not configured"  | Missing API key               | Add SMS_API_KEY to environment variables   |
| "User is inactive"            | User account disabled         | Activate user account                      |

## Security Considerations

- Phone numbers are validated but not sanitized for storage
- SMS content is logged for debugging (consider privacy in production)
- API keys are properly secured in environment variables
- No phone numbers are displayed in client-side logs

## Monitoring and Alerts

- Console logs provide real-time feedback
- SMS delivery failures are logged but don't block operations
- Regular SMS readiness checks recommended
- Consider setting up monitoring for SMS delivery rates
