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
import {signIn} from "next-auth/react"
import Navbar from "@/app/navbar/navbar";

const formSchema = zod.object({
    username: zod.string().min(2,"Username must be at least 2 characters").max(50,"Username must be at most 50 characters").refine((value) => {
        const regex = /^[a-zA-Z0-9_]{2,50}$/;
        return regex.test(value);
    }, "Username must be alphanumeric and at least 2 characters"),
    email: zod.string().email("Invalid email address").refine((value) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(value);
    }, "Invalid email address"),
    password: zod.string().min(6,"Password must be at least 6 characters").refine((value) => {
        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        return regex.test(value);
    }, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    confirmPassword: zod.string().min(6,"Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, { 
    message: "Passwords must match",
    path: ["confirmPassword"],
});

const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<zod.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const router = useRouter();

    async function onSubmit(data: zod.infer<typeof formSchema>) {
        try {
            const result = await signIn('credentials', {
                username: data.username,
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                console.error('Sign-in error:', result.error);
            } else {
                router.push("/login");
            }
        } catch (error) {
            console.error('Sign-in error:', error);
        }
    }

    const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
        if (field === 'password') {
            setShowPassword(!showPassword);
        } else {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

    const handleSignIn = async () => {
        try {
            const result = await signIn('google', {
                callbackUrl: '/',
                redirect: false
            });

            if (result?.error) {
                console.error('Sign-in error:', result.error);
            } else if (result?.ok) {
                window.location.href = result.url || '/';
            }
        } catch (error) {
            console.error('Error signing in:', error);
        }
    };

    const handleTwitterSignIn = async () => {
        try {
            const result = await signIn('twitter', {
                callbackUrl: `${window.location.origin}/`,
                redirect: true
            });
            if (result?.error) {
                console.error('Sign-in failed:', result.error);
            } else if (result?.ok) {
                window.location.href = result.url || '/';
            }
        } catch (error) {
            console.error('Error signing in with Twitter:', error);
        }
    };

    const handleFacebookSignIn = async () => {
        try {
            const result = await signIn('facebook', {
                callbackUrl: `${window.location.origin}/`,
                redirect: true
            });
            if (result?.error) {
                console.error('Sign-in failed:', result.error);
            } else if (result?.ok) {
                window.location.href = result.url || '/';
            }
        } catch (error) {
            console.error('Error signing in with Facebook:', error);
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
                        <p className="text-gray-500">
                            Join ESG Insights to transform your sustainability reporting
                        </p>
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
                                                    className="w-full p-3 border rounded-lg pr-10 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('password')}
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
                                                    className="w-full p-3 border rounded-lg pr-10 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('confirmPassword')}
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
                                
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors duration-300 ease-in-out transform hover:scale-105"
                            >
                                Create Account
                            </Button>
                        </form>
                    </Form>
                    
                    <div className="text-center">
                        <div className="flex items-center justify-center my-4">
                            <div className="border-t border-gray-300 flex-grow mr-3"></div>
                            <span className="text-gray-500 text-sm">Or sign up with</span>
                            <div className="border-t border-gray-300 flex-grow ml-3"></div>
                        </div>
                        
                        <div className="flex justify-center space-x-4 mt-4">
                            <button 
                                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors" 
                                onClick={handleFacebookSignIn}
                            >
                                <FaFacebook size={20} />
                            </button>
                            <button 
                                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" 
                                onClick={handleSignIn}
                            >
                                <FaGoogle size={20} />
                            </button>
                            <button className="p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors"
                                onClick={handleTwitterSignIn}
                                >
                                <FaTwitter size={20} />
                            </button>
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