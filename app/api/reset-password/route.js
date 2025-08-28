import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, newPassword } = await req.json();
    
    if (!email || !newPassword) {
      return new Response(JSON.stringify({ 
        error: "Email and new password required" 
      }), { status: 400 });
    }

    await connectDB();
    
    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ 
        error: "User not found" 
      }), { status: 404 });
    }

    // Create fresh hash
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Test the new hash immediately
    const testVerification = await bcrypt.compare(newPassword, hashedPassword);
    
    if (!testVerification) {
      return new Response(JSON.stringify({ 
        error: "Hash verification failed during creation" 
      }), { status: 500 });
    }
    
    // Update user password
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword 
    });
    
    return new Response(JSON.stringify({
      message: "Password reset successful",
      user: {
        email: user.email,
        name: user.name
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(JSON.stringify({ 
      error: "Password reset failed",
      details: error.message 
    }), { status: 500 });
  }
}
