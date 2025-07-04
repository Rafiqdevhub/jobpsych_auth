// Simple test to check the API
const testPayment = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: "pro",
        customer_email: "test@example.com",
      }),
    });

    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
};

testPayment();
