import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import { User } from "../../../../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authOptions = {
  providers: [
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
        if (!user) throw new Error("No user found");

        // Check if user is active
        if (user.isActive === false) {
          throw new Error("Your subscription has expired. Please contact our support team to renew your subscription and regain access.");
        }

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

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        if (typeof user.businessName !== 'undefined') {
          token.businessName = user.businessName;
        }
        if (user.isStaff) {
          token.isStaff = true;
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
