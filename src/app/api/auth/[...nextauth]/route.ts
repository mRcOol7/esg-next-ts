import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from 'crypto';
import { saveSocialProviderToTiDB, saveUserToTiDB } from '@/lib/tidb';
import { redis } from '@/lib/redis';

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
    debug: process.env.NODE_ENV === 'development',
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    cookies: {
        sessionToken: {
            name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_DOMAIN : undefined,
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
        signOut: '/login',
        error: '/login',
    },
    callbacks: {
        async signIn({ user, account }) {
            try {
                if (account && user) {
                    console.log(' Social sign-in attempt:', {
                        provider: account.provider,
                        email: user.email,
                        id: user.id
                    });

                    // First ensure the user exists in our database
                    const userData = {
                        id: user.id,
                        email: user.email!,
                        username: user.email!.split('@')[0],
                        name: user.name || undefined,
                        image: user.image || undefined
                    };
                    
                    // Save to TiDB first
                    await saveUserToTiDB(userData);

                    // Then cache in Redis
                    await redis.cacheUserData(user.id, {
                        ...userData,
                        provider: account.provider,
                        lastLogin: new Date().toISOString()
                    });

                    // Generate a unique ID for the social provider record
                    const socialProviderId = crypto.randomUUID();
                    
                    
                    await saveSocialProviderToTiDB({
                        id: socialProviderId,
                        user_id: user.id,
                        provider: account.provider,
                        provider_user_id: account.providerAccountId,
                        provider_email: user.email || undefined,
                        provider_username: user.email?.split('@')[0] || undefined,
                        provider_name: user.name || undefined,
                        provider_image: user.image || undefined,
                        access_token: account.access_token,
                        refresh_token: account.refresh_token,
                        token_expires_at: account.expires_at ? new Date(account.expires_at * 1000) : undefined
                    });

                    // Cache social provider data in Redis
                    await redis.saveUserSocialData(user.id, account.provider, {
                        id: socialProviderId,
                        name: user.name || undefined,
                        email: user.email || undefined,
                        image: user.image || undefined,
                        username: user.email?.split('@')[0] || undefined,
                        accessToken: account.access_token,
                        refreshToken: account.refresh_token
                    });

                    console.log(' Social provider data saved successfully');
                }
                return true;
            } catch (error) {
                console.error(' Error in signIn callback:', error);
                // Still return true to allow sign in, but log the error
                return true;
            }
        },
        async jwt({ token, user, account }) {
            try {
                if (account && user) {
                    console.log(' Updating JWT token with user data');
                    token.accessToken = account.access_token;
                    token.id = user.id;
                    token.email = user.email;
                }
                return token;
            } catch (error) {
                console.error(' Error in jwt callback:', error);
                return token;
            }
        },
        async session({ session, token }) {
            try {
                if (token && session.user) {
                    console.log(' Updating session with user data');
                    session.user.id = token.sub as string;
                    session.user.email = token.email as string;
                }
                return session;
            } catch (error) {
                console.error(' Error in session callback:', error);
                return session;
            }
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url;
            // Always redirect to home after sign in if no callback URL is specified
            return `${baseUrl}/home`;
        }
    }
});

export { handler as GET, handler as POST };