import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import { User } from "../../../../models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    Credentials({
      async authorize(credentials) {
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
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name;
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
