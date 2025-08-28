import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: "Email and password required" 
      }), { status: 400 });
    }

    await connectDB();
    
    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ 
        error: "User not found" 
      }), { status: 404 });
    }

    // Test multiple scenarios
    const tests = [
      { name: "Original", password: password },
      { name: "Trimmed", password: password.trim() },
      { name: "No spaces", password: password.replace(/\s/g, '') },
    ];
    
    const results = {};
    
    for (const test of tests) {
      const isValid = await bcrypt.compare(test.password, user.password);
      results[test.name] = {
        password: test.password,
        length: test.password.length,
        valid: isValid
      };
    }
    
    // Test if we can create a new hash with same password and compare
    const freshHash = await bcrypt.hash(password, 10);
    const freshTest = await bcrypt.compare(password, freshHash);
    
    return new Response(JSON.stringify({
      message: "Password debug test completed",
      user: {
        email: user.email,
        name: user.name,
        hasPassword: !!user.password
      },
      tests: results,
      freshHashTest: freshTest
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Password test error:", error);
    return new Response(JSON.stringify({ 
      error: "Test failed",
      details: error.message 
    }), { status: 500 });
  }
}
