import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Function to generate the next hotel code
async function getNextHotelCode() {
  await connectDB();
  
  // Find the user with the highest hotel code
  const lastUser = await User.findOne({ 
    hotelCode: { $exists: true, $ne: null },
    role: 'user'
  }).sort('-hotelCode').limit(1);

  let nextNumber = 1;
  
  if (lastUser && lastUser.hotelCode) {
    // Extract the numeric part and increment
    const lastCode = lastUser.hotelCode;
    const lastNumber = parseInt(lastCode.substring(1), 10);
    nextNumber = lastNumber + 1;
  }
  
  // Format as A0001, A0002, etc.
  return `A${nextNumber.toString().padStart(4, '0')}`;
}
import jwt from "jsonwebtoken";

const DEFAULT_ADMIN_ID = "6839bc71a5c0f5705ebf8345";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      async authorize(credentials) {
        // Staff token login
        if (credentials?.staffToken) {
          try {
            const payload = jwt.verify(credentials.staffToken, process.env.NEXTAUTH_SECRET);

            return {
              id: payload.id,
              email: payload.email,
              role: payload.role,
              name: payload.name,
              isStaff: true,
              staffId: payload.staffId,
              hotelOwner: payload.hotelOwner,
              hotelCode: payload.hotelCode,
              position: payload.position,
              department: payload.department,
            };
          } catch (e) {
            throw new Error("Invalid or expired staff token");
          }
        }

        await connectDB();

        // FIND USER
        let user = await User.findOne({ email: credentials.email });

        // AUTO SIGN-UP IF NOT EXIST
        if (!user) {
          // Generate next hotel code for new users
          const hotelCode = await getNextHotelCode();
          
          user = await User.create({
            name: credentials.name || credentials.email.split("@")[0],
            email: credentials.email,
            password: await bcrypt.hash(credentials.password, 12),
            role: "user",
            isActive: true,
            hotelCode: hotelCode, // Assign the generated hotel code
            businessName: credentials.businessName || (credentials.email.split("@")[0] + "'s Business"),
            createdBy: DEFAULT_ADMIN_ID,
          });

          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            businessName: user.businessName,
            hotelCode: user.hotelCode,
          };
        }

        // Subscription check
        if (user.isActive === false) {
          throw new Error("Your subscription has expired. Please contact support.");
        }

        // Password check
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name,
          businessName: user.businessName || "",
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account, profile, email }) {
      // Only handle Google OAuth
      if (account.provider === 'google') {
        try {
          await connectDB();
          
          // Check if user exists
          let dbUser = await User.findOne({ email: user.email });
          
          // Auto-signup if user doesn't exist
          if (!dbUser) {
            // Generate next hotel code for new users
            const hotelCode = await getNextHotelCode();
            
            const randomPassword = require('crypto').randomBytes(16).toString('hex');
            const userData = {
              name: user.name || user.email.split('@')[0],
              email: user.email,
              role: 'user',
              isActive: true,
              businessName: user.name || 'My Business',
              createdBy: DEFAULT_ADMIN_ID,
              hotelCode: hotelCode, // Assign the generated hotel code
              // Set a random password for OAuth users
              password: await bcrypt.hash(randomPassword, 12)
            };
            
            // Create the user with the generated password and hotel code
            dbUser = await User.create(userData);
          }
          
          // Update user data
          user.id = dbUser._id.toString();
          user.role = dbUser.role;
          user.businessName = dbUser.businessName;
          
          return true;
        } catch (error) {
          console.error('Google signin error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // Handle Google OAuth
        if (account.provider === 'google') {
          // User data is already handled in signIn callback
          token.id = user.id;
          token.role = user.role;
          token.businessName = user.businessName || '';
        }
        // Handle credentials login
        else if (account.provider === 'credentials') {
          token.id = user.id;
          token.role = user.role;
          token.businessName = user.businessName || '';
          if (user.isStaff) {
            token.isStaff = true;
            token.staffId = user.staffId;
            token.hotelOwner = user.hotelOwner;
            token.hotelCode = user.hotelCode;
            token.position = user.position;
            token.department = user.department;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.businessName = token.businessName || '';
        
        // Add staff-related fields if they exist
        if (token.isStaff) {
          session.user.isStaff = true;
          session.user.staffId = token.staffId;
          session.user.hotelOwner = token.hotelOwner;
          session.user.hotelCode = token.hotelCode;
          session.user.position = token.position;
          session.user.department = token.department;
        }
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl + "/api/auth/callback")) {
        const redirectUrl = new URL(url, baseUrl);
        const redirectParam = redirectUrl.searchParams.get("redirect");
        if (redirectParam) return redirectParam;
        return baseUrl;
      }
      return url;
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
