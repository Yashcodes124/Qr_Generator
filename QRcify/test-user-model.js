// test-user-model.js
import User from "./backend/models/user.js";
import { connectDB } from "./backend/config/database.js";

async function testUserModel() {
  console.log("🧪 Testing User Model...");

  try {
    // Connect to database
    await connectDB();

    // Test creating a user
    const testUser = await User.create({
      email: "test@example.com",
      password: "testpassword123",
    });

    console.log("✅ User created successfully!");
    console.log("User details:", {
      id: testUser.id,
      email: testUser.email,
      isVerified: testUser,
      createdAt: testUser.createdAt,
    });

    // Test password hashing worked
    console.log(
      "🔐 Password is hashed:",
      testUser.password !== "testpassword123"
    );
    console.log(
      "🔐 Password starts with bcrypt:",
      testUser.password.startsWith("$2b$")
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testUserModel();
