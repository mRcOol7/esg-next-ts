"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/app/navbar/navbar";

export default function Home() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (!session) {
        return null;
    }

    return (
        <div>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Welcome to ESG</h1>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Name:</label>
                        <p className="text-gray-600">{session.user?.name}</p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Email:</label>
                        <p className="text-gray-600">{session.user?.email}</p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Phone:</label>
                        <p className="text-gray-600">+91 1234567890</p>
                    </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 font-bold mb-2">Address:</label>
                        <p className="text-gray-600">Vadodara, Gujarat, India</p>
                    </div>
                    {/* Add your dashboard content here */}
                </div>
            </main>
        </div>
    );
}
