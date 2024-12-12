"use client"
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
    Form,
    FormField,
    FormControl,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FaFacebook, FaGoogle, FaTwitter, FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Navbar from "@/app/navbar/navbar";

const formSchema = zod.object({
    email: zod.string().email("Invalid email address"),
    password: zod.string().min(6, "Password must be at least 6 characters"),
});

const Login = (): React.JSX.Element => {
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const form = useForm<zod.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });
    
    function onSubmit() {
        router.push("/home");
    }

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

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (event) => {
        event.preventDefault();
        await handleSignIn();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            
            <div className="container mx-auto px-4 py-16 flex-grow flex items-center justify-center">
                <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-green-700 mb-4">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500">
                            Log in 
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Enter your email" 
                                                {...field}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input 
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter your password" 
                                                    {...field}
                                                    className="w-full p-3 border rounded-lg pr-10 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            
                            <div className="flex justify-end">
                                <Link 
                                    href="/forgot-password" 
                                    className="text-sm text-green-600 hover:underline"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            
                            <Button 
                                type="submit" 
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors duration-300 ease-in-out transform hover:scale-105"
                            >
                                Login
                            </Button>
                        </form>
                    </Form>
                    
                    <div className="text-center">
                        <div className="flex items-center justify-center my-4">
                            <div className="border-t border-gray-300 flex-grow mr-3"></div>
                            <span className="text-gray-500 text-sm">Or log in with</span>
                            <div className="border-t border-gray-300 flex-grow ml-3"></div>
                        </div>
                        
                        <div className="flex justify-center space-x-4 mt-4">
                            <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors" onClick={handleFacebookSignIn}>
                                <FaFacebook size={20} />
                            </button>
                            <button className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" onClick={handleClick}>
                                <FaGoogle size={20} />
                            </button>
                            <button className="p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors" onClick={handleTwitterSignIn}>
                                <FaTwitter size={20} />
                            </button>
                        </div>
                    
                    </div>
                    
                    <p className="text-center text-gray-600 mt-4">
                        Don&apos;t have an account?{" "}
                        <Link 
                            href="/signup" 
                            className="text-green-600 hover:underline font-semibold"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;