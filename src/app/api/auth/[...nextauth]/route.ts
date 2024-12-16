import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }
                return {
                    id: "1",
                    email: credentials.email,
                    name: credentials.email.split('@')[0]
                };
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "select_account",
                    access_type: "online",
                }
            }
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        }),
        TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID!,
            clientSecret: process.env.TWITTER_CLIENT_SECRET!,
            version: "2.0",
            authorization: {
                url: "https://twitter.com/i/oauth2/authorize",
                params: {
                    scope: "users.read tweet.read offline.access"
                }
            }
        }),
    ],
    debug: true,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        callbackUrl: {
            name: `next-auth.callback-url`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        csrfToken: {
            name: `next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    pages: {
        signIn: '/login',
        error: '/auth/error',
        signOut: '/'
    },
    callbacks: {
        async redirect() {
            // Always redirect to home after sign in
            return '/home';
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub;
                session.accessToken = token.accessToken;
            }
            return session;
        },
        async jwt({ token, user, account }) {
            if (account && user) {
                token.accessToken = account.access_token;
                token.id = user.id;
                
                // Store user data in Redis after successful social sign-in
                try {
                    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/user/social`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: user.id,
                            provider: account.provider,
                            socialData: {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                image: user.image,
                                accessToken: account.access_token,
                            }
                        })
                    });

                    if (!response.ok) {
                        console.error('Failed to store social user data');
                    }
                } catch (error) {
                    console.error('Error storing social user data:', error);
                }
            }
            return token;
        }
    }
});

export { handler as GET, handler as POST };
