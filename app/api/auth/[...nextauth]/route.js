import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import { User } from "../../../../models/User";
import jwt from "jsonwebtoken";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        // Staff token based auth
        if (credentials?.staffToken) {
          try {
            const payload = jwt.verify(credentials.staffToken, process.env.NEXTAUTH_SECRET);
            // Return as a NextAuth user object
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
        
        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          throw new Error("No user found");
        }
        
        // Check if user is active
        if (user.isActive === false) {
          throw new Error("Your subscription has expired. Please contact our support team to renew your subscription and regain access.");
        }

        // Simple string comparison for plain text passwords
        const isValid = credentials.password === user.password;
        
        if (!isValid) {
          throw new Error("Invalid password");
        }

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
    signIn: '/login', // Your login page path
    error: '/login', // Redirect to login on error
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // For Google OAuth
        if (account.provider === 'google') {
          await connectDB();
          // Check if user exists in your database
          let dbUser = await User.findOne({ email: user.email });
          
          // If user doesn't exist, create a new user
          if (!dbUser) {
            dbUser = await User.create({
              name: user.name,
              email: user.email,
              role: 'user', // Default role
              isActive: true,
              // Add other default fields as needed
            });
          }
          
          // Update token with user data from database
          token.id = dbUser._id;
          token.role = dbUser.role;
          token.isStaff = dbUser.isStaff || false;
          token.hotelOwner = dbUser.hotelOwner;
          token.hotelCode = dbUser.hotelCode;
        } else {
          // For credentials login
          token.id = user.id;
          token.role = user.role;
          token.isStaff = user.isStaff;
          token.staffId = user.staffId;
          token.hotelOwner = user.hotelOwner;
          token.hotelCode = user.hotelCode;
          token.position = user.position;
          token.department = user.department;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
        if (typeof token.businessName !== 'undefined') {
          session.user.businessName = token.businessName;
        }
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
      // Only redirect after successful login
      if (url.startsWith(baseUrl + '/api/auth/callback')) {
        const redirectUrl = new URL(url, baseUrl);
        const redirectParam = redirectUrl.searchParams.get('redirect');
        if (redirectParam) {
          return redirectParam;
        }
        return baseUrl;
      }
      return url;
    }
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
