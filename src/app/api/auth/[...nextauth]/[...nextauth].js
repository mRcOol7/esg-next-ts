import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      version: "2.0",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Enter your email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          // Return full user object with all required fields
          return {
            id: credentials.email, // Using email as ID for simplicity
            email: credentials.email,
            name: credentials.email.split('@')[0], // Default name from email
            image: null,
            username: credentials.email.split('@')[0], // Default username from email
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/user/social`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id || user.email,
            provider: account?.provider || 'credentials',
            socialData: {
              email: user.email,
              name: user.name,
              image: user.image,
              username: user.username || user.email?.split('@')[0],
              provider: account?.provider || 'credentials'
            }
          }),
        });
        
        if (!response.ok) {
          console.error("Failed to store user data");
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("Error storing user data:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl + "/home"
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
};

export default NextAuth(authOptions);