// Test script for JobPsych Payment API
const API_BASE = "http://localhost:5000/api";

async function testAPI() {
  console.log("🧪 Testing JobPsych Payment API...\n");

  // Test 1: Get available plans
  console.log("1️⃣ Testing GET /api/plans");
  try {
    const response = await fetch(`${API_BASE}/plans`);
    const data = await response.json();
    console.log("✅ Plans response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Plans test failed:", error);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2: Create payment with proper JSON
  console.log("2️⃣ Testing POST /api/pay (Pro plan)");
  try {
    const paymentData = {
      plan: "pro",
      customer_email: "test@example.com",
      customer_name: "Test User",
    };

    console.log(
      "📤 Sending request with data:",
      JSON.stringify(paymentData, null, 2)
    );

    const response = await fetch(`${API_BASE}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Payment response:", JSON.stringify(data, null, 2));
      return data.payment_id; // Return for status test
    } else {
      console.error("❌ Payment failed:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Payment test failed:", error);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 3: Test Premium plan
  console.log("3️⃣ Testing POST /api/pay (Premium plan)");
  try {
    const premiumData = {
      plan: "premium",
      customer_email: "premium@example.com",
      customer_name: "Premium User",
    };

    console.log(
      "📤 Sending premium request:",
      JSON.stringify(premiumData, null, 2)
    );

    const response = await fetch(`${API_BASE}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(premiumData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(
        "✅ Premium payment response:",
        JSON.stringify(data, null, 2)
      );
    } else {
      console.error(
        "❌ Premium payment failed:",
        JSON.stringify(data, null, 2)
      );
    }
  } catch (error) {
    console.error("❌ Premium payment test failed:", error);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 4: Test invalid plan
  console.log("4️⃣ Testing POST /api/pay (Invalid plan)");
  try {
    const invalidData = {
      plan: "basic", // Invalid plan
      customer_email: "test@example.com",
    };

    const response = await fetch(`${API_BASE}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invalidData),
    });

    const data = await response.json();
    console.log("✅ Expected error response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Invalid plan test failed:", error);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 5: Test missing content-type
  console.log("5️⃣ Testing POST /api/pay (Missing Content-Type)");
  try {
    const response = await fetch(`${API_BASE}/pay`, {
      method: "POST",
      // No Content-Type header
      body: JSON.stringify({
        plan: "pro",
        customer_email: "test@example.com",
      }),
    });

    const data = await response.json();
    console.log(
      "✅ Missing content-type response:",
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error("❌ Missing content-type test failed:", error);
  }
}

// Run the tests
testAPI().catch(console.error);
