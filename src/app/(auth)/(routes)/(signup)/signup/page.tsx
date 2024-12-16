"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import * as zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
    Form,
    FormField,
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FaFacebook, FaGoogle, FaTwitter, FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Navbar from "@/app/navbar/navbar";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Define types for form data and social sign-in
type SocialProvider = 'google' | 'facebook' | 'twitter';

interface SocialSignInData {
    provider: SocialProvider;
    id?: string;
    email?: string;
    name?: string;
    image?: string;
    username?: string;
    accessToken?: string;
    refreshToken?: string;
    providerData?: {
        sub?: string;
        emailVerified?: boolean;
        locale?: string;
    };
}

const formSchema = zod.object({
    username: zod.string()
        .min(2, "Username must be at least 2 characters")
        .max(50, "Username must be at most 50 characters")
        .refine((value) => /^[a-zA-Z0-9_]{2,50}$/.test(value), 
            "Username must be alphanumeric and can include underscores"),
    email: zod.string()
        .email("Invalid email address")
        .refine((value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value), 
            "Invalid email address"),
    password: zod.string()
        .min(6, "Password must be at least 6 characters")
        .refine((value) => 
            /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(value),
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    confirmPassword: zod.string()
        .min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, { 
    message: "Passwords must match",
    path: ["confirmPassword"],
});

const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<zod.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: zod.infer<typeof formSchema>) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const data = await response.json();
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: data.error || 'Failed to create account'
                });
                throw new Error(data.error || 'Failed to create account');
            }

            toast({
                title: "Success",
                description: "Account created successfully!"
            });

            // Redirect to login page
            router.push('/login');
        } catch (error) {
            console.error('Signup error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialSignIn = async (provider: SocialProvider) => {
        try {
            setIsLoading(true);
            console.log('🚀 Starting social sign-in with:', provider);
      
            const result = await signIn(provider, {
                callbackUrl: '/',
                redirect: false,
            });
      
            if (result?.error) {
                console.error('❌ Sign-in error:', result.error);
                throw new Error(result.error);
            }

            console.log('✅ Successfully signed in with provider:', provider);
      
            // Get session data after successful sign in
            console.log('🔄 Fetching session data...');
            const session = await fetch('/api/auth/session');
            const userData = await session.json();
            console.log('📦 Received user data:', userData);
      
            if (!userData.user?.email) {
                console.error('❌ No user data available');
                throw new Error('No user data available');
            }
      
            // Prepare social data with all available information
            console.log('🔄 Preparing social data for storage...');
            const socialData: SocialSignInData = {
                provider,
                id: userData.user?.id,
                email: userData.user?.email,
                name: userData.user?.name || userData.user?.email?.split('@')[0],
                image: userData.user?.image,
                username: userData.user?.name || userData.user?.email?.split('@')[0],
                accessToken: userData.accessToken,
                refreshToken: userData.refreshToken,
                providerData: {
                    sub: userData.user?.id,
                    emailVerified: userData.user?.emailVerified,
                    locale: userData.user?.locale,
                },
            };
            console.log('📝 Social data prepared:', socialData);
      
            // Save user data to Redis
            console.log('💾 Saving user data to Redis...');
            const response = await fetch('/api/user/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData.user?.id,
                    provider,
                    socialData,
                }),
            });
      
            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Failed to save data:', errorData);
                throw new Error(errorData.message || 'Failed to save social sign-up data');
            }

            const savedData = await response.json();
            console.log('✅ Data saved successfully:', savedData);
      
            toast({
                title: "Success!",
                description: `Successfully signed in with ${provider}`,
            });
      
            router.push("/");
        } catch (error) {
            console.error(`❌ ${provider} sign-in error:`, error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "An unexpected error occurred",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
        if (field === 'password') {
            setShowPassword(!showPassword);
        } else {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            
            <div className="container mx-auto px-4 py-16 flex-grow flex items-center justify-center">
                <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-green-700 mb-4">
                            Create Your Account
                        </h1>
                    </div>

                    <Form {...form}>
                        <form 
                            onSubmit={form.handleSubmit(onSubmit)} 
                            className="space-y-6"
                        >
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Choose a unique username" 
                                                {...field}
                                                disabled={isLoading}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">Email</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Enter your email address" 
                                                {...field}
                                                disabled={isLoading}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input 
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Create a strong password" 
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="w-full p-3 border rounded-lg pr-10 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('password')}
                                                    disabled={isLoading}
                                                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-700">Confirm Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input 
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirm your password" 
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="w-full p-3 border rounded-lg pr-10 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('confirmPassword')}
                                                    disabled={isLoading}
                                                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                                                >
                                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                )}
                            />
                            
                            <Button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>
                    </Form>
                    
                    <div className="text-center">
                        <div className="flex items-center justify-center my-4">
                            <div className="border-t border-gray-300 flex-grow mr-3"></div>
                            <span className="text-gray-500 text-sm">Or sign up with</span>
                            <div className="border-t border-gray-300 flex-grow ml-3"></div>
                        </div>
                        
                        <div className="flex flex-col space-y-4 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSocialSignIn('google')}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center space-x-2 py-2 border rounded-lg hover:bg-gray-50 transition-all duration-300"
                            >
                                <FaGoogle className="text-red-500" />
                                <span>Continue with Google</span>
                            </Button>
                                
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSocialSignIn('facebook')}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center space-x-2 py-2 border rounded-lg hover:bg-gray-50 transition-all duration-300"
                            >
                                <FaFacebook className="text-blue-600" />
                                <span>Continue with Facebook</span>
                            </Button>
                                
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSocialSignIn('twitter')}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center space-x-2 py-2 border rounded-lg hover:bg-gray-50 transition-all duration-300"
                            >
                                <FaTwitter className="text-blue-400" />
                                <span>Continue with Twitter</span>
                            </Button>
                        </div>
                    </div>
                    
                    <p className="text-center text-gray-600 mt-4">
                        Already have an account?{" "}
                        <Link 
                            href="/login" 
                            className="text-green-600 hover:underline font-semibold"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;