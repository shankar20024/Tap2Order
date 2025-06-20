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
      // ✅ include name and role in token
      if (user) {
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      // ✅ assign token fields to session
      session.user.role = token.role;
      session.user.name = token.name;
      session.user.id = token.sub;
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url === "/api/auth/callback/credentials") {
        return baseUrl;
      }
      return url;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
