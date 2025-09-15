-- Check if users with required roles have phone numbers
SELECT 
  id,
  name,
  email,
  role,
  phone,
  smsNotifications,
  isActive
FROM "User" 
WHERE role IN ('SUPERADMIN', 'CEO', 'DEPUTY_CEO')
ORDER BY role;