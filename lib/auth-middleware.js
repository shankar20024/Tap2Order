import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import jwt from "jsonwebtoken";

export async function getAuthUser(request) {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      return {
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role || 'user'
        }
      };
    }

    // Fallback to JWT token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        return {
          success: true,
          user: {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role || 'user'
          }
        };
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
      }
    }

    return {
      success: false,
      error: 'Authentication required'
    };

  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}
