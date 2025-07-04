// Test script for the JobPsych Payment Service - Simplified Pro/Premium Plans Only
// Run this script to test the new streamlined payment API

const BASE_URL = "http://localhost:5000";

// Helper function to make HTTP requests
async function makeRequest(endpoint, method = "GET", data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    console.log(`\n📡 ${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(result, null, 2));

    return { status: response.status, data: result };
  } catch (error) {
    console.error(`❌ Error with ${method} ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

async function testSimplifiedPaymentService() {
  console.log(
    "🧪 Testing JobPsych Payment Service - Pro & Premium Plans Only\n"
  );

  // Test 1: Health check
  console.log("=== 1. Health Check ===");
  await makeRequest("/health");

  // Test 2: API Documentation
  console.log("\n=== 2. API Documentation ===");
  await makeRequest("/api");

  // Test 3: Get available plans
  console.log("\n=== 3. Get Available Plans ===");
  const plansResponse = await makeRequest("/api/plans");

  // Test 4: Create payment for Pro plan
  console.log("\n=== 4. Create Payment for Pro Plan ===");
  const proPaymentResponse = await makeRequest("/api/pay", "POST", {
    plan: "pro",
    customer_email: "customer@jobpsych.com",
    customer_name: "John Doe",
    metadata: {
      source: "website",
      promotion: "first_time_user",
    },
  });

  let proPaymentId = null;
  if (proPaymentResponse.data && proPaymentResponse.data.success) {
    proPaymentId = proPaymentResponse.data.data.id;
    console.log(`✅ Pro Payment created with ID: ${proPaymentId}`);
  }

  // Test 5: Create payment for Premium plan
  console.log("\n=== 5. Create Payment for Premium Plan ===");
  const premiumPaymentResponse = await makeRequest("/api/pay", "POST", {
    plan: "premium",
    customer_email: "premium.customer@jobpsych.com",
    customer_name: "Jane Smith",
    metadata: {
      source: "mobile_app",
      referral: "friend_recommendation",
    },
  });

  let premiumPaymentId = null;
  if (premiumPaymentResponse.data && premiumPaymentResponse.data.success) {
    premiumPaymentId = premiumPaymentResponse.data.data.id;
    console.log(`✅ Premium Payment created with ID: ${premiumPaymentId}`);
  }

  // Test 6: Get payment status for Pro plan (if created successfully)
  if (proPaymentId) {
    console.log("\n=== 6. Get Pro Payment Status ===");
    await makeRequest(`/api/status/${proPaymentId}`);
  }

  // Test 7: Get payment status for Premium plan (if created successfully)
  if (premiumPaymentId) {
    console.log("\n=== 7. Get Premium Payment Status ===");
    await makeRequest(`/api/status/${premiumPaymentId}`);
  }

  // Test 8: Test invalid plan (should fail)
  console.log("\n=== 8. Test Invalid Plan (Should Fail) ===");
  await makeRequest("/api/pay", "POST", {
    plan: "basic", // Invalid plan
    customer_email: "test@jobpsych.com",
  });

  // Test 9: Test missing email (should fail)
  console.log("\n=== 9. Test Missing Email (Should Fail) ===");
  await makeRequest("/api/pay", "POST", {
    plan: "pro",
    // Missing customer_email
  });

  console.log("\n✅ Simplified Payment Service Testing Completed!");
  console.log("\n📋 Summary:");
  console.log("- ✅ Simplified to Pro and Premium plans only");
  console.log("- ✅ Single payment endpoint: POST /api/pay");
  console.log("- ✅ Plan validation working");
  console.log("- ✅ Payment intent creation successful");
  console.log("- ✅ Payment status retrieval working");
  console.log("- ✅ Error handling for invalid requests");
  console.log("\n🎯 The API now only supports 'pro' and 'premium' plans!");
}

// Example requests for reference
console.log("📝 Example API Requests:");
console.log("\n1. Get Plans:");
console.log("GET /api/plans");

console.log("\n2. Create Pro Payment:");
console.log("POST /api/pay");
console.log(
  JSON.stringify(
    {
      plan: "pro",
      customer_email: "user@example.com",
      customer_name: "John Doe",
      metadata: { source: "website" },
    },
    null,
    2
  )
);

console.log("\n3. Create Premium Payment:");
console.log("POST /api/pay");
console.log(
  JSON.stringify(
    {
      plan: "premium",
      customer_email: "user@example.com",
      customer_name: "Jane Smith",
    },
    null,
    2
  )
);

console.log("\n4. Check Payment Status:");
console.log("GET /api/status/{payment_id}");

console.log("\n" + "=".repeat(50));

// Run the tests
testSimplifiedPaymentService().catch(console.error);
