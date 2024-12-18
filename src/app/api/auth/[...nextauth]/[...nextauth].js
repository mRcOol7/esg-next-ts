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
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: "select_account"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.name || profile.email.split('@')[0]
        };
      }
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
    async signIn({ user, account, profile }) {
      console.log(' [NextAuth] Sign In Callback - Start');
      console.log(' User Data:', JSON.stringify(user, null, 2));
      console.log(' Account Data:', JSON.stringify(account, null, 2));
      console.log(' Profile Data:', JSON.stringify(profile, null, 2));

      try {
        if (!user.email) {
          console.error(" [NextAuth] No email provided from social login");
          return false;
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        console.log(' [NextAuth] Making request to:', `${baseUrl}/api/user/social`);
        
        const response = await fetch(`${baseUrl}/api/user/social`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: user.image,
            provider: account.provider,
            username: user.name || user.email.split('@')[0],
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            providerAccountId: account.providerAccountId,
            providerId: account.provider,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(" [NextAuth] Failed to store social data:", errorText);
          return false;
        }

        console.log(' [NextAuth] Social login data stored successfully');
        return true;
      } catch (error) {
        console.error(" [NextAuth] Error in signIn callback:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url === baseUrl) return `${baseUrl}/home`
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token }) {
      console.log(' [NextAuth] Session Callback');
      console.log(' Session Data:', JSON.stringify(session, null, 2));
      console.log(' Token Data:', JSON.stringify(token, null, 2));

      if (token) {
        session.user.id = token.sub;
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      console.log(' [NextAuth] JWT Callback');
      console.log(' Token Data:', JSON.stringify(token, null, 2));
      console.log(' User Data:', JSON.stringify(user, null, 2));
      console.log(' Account Data:', JSON.stringify(account, null, 2));

      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id;
        token.provider = account.provider;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
};

export default NextAuth(authOptions);