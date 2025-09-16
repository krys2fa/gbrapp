// test-sms.js - Run this with: node test-sms.js
const fetch = require('node-fetch');

async function testArkeselSMS() {
  const apiKey = "cEdwbGF5ZldWVlN3R2JRZHlHRUs"; // Your API key from .env
  const testPhoneNumber = "233241234567"; // Replace with your actual test number
  const testMessage = "Test SMS from GBR System - SMS service is working!";

  try {
    console.log("Testing Arkesel SMS service...");
    console.log("Phone:", testPhoneNumber);
    console.log("Message:", testMessage);
    
    const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: "GBR System",
        message: testMessage,
        recipients: [testPhoneNumber],
      }),
    });

    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response body:", JSON.stringify(result, null, 2));
    
    if (response.ok && result.code === "ok") {
      console.log("✅ SMS sent successfully!");
    } else {
      console.log("❌ SMS sending failed:", result);
    }
  } catch (error) {
    console.error("❌ Error testing SMS:", error);
  }
}

testArkeselSMS();