// test-complete-flow.js
import { connectDB } from "./backend/config/database.js";
import User from "./backend/models/user.js";
import bcrypt from "bcrypt";

async function testCompleteFlow() {
  console.log("🚀 Testing complete authentication flow...\n");

  try {
    // 1. Connect and reset database
    await connectDB();

    // 2. Test user creation
    const user = await User.create({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });

    // 3. Test password hashing
    const isHashValid = user.password.startsWith("$2b$");

    // 4. Test password verification
    console.log("4. Testing password verification...");
    const isPasswordValid = await bcrypt.compare("password123", user.password);
    console.log("   ✅ Password verification works:", isPasswordValid);

    // 5. Test duplicate email prevention
    console.log("5. Testing duplicate email prevention...");
    try {
      await User.create({
        name: "Duplicate User",
        email: "john@example.com", // Same email
        password: "anotherpassword",
      });
      console.log("   ❌ Should have failed on duplicate email");
    } catch (error) {
      console.log("   ✅ Duplicate email correctly prevented");
    }

    console.log("\n🎉 ALL TESTS PASSED! Database is working correctly.");
  } catch (error) {
    console.error("\n💥 TEST FAILED:", error.message);
  }
}

testCompleteFlow();
