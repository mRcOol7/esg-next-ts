"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NextTopLoader from "nextjs-toploader";
import Navbar from "@/app/navbar/navbar";

const ProfilePage = () => {
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

    const userData = {
        name: "Nehal",
        email: "nehal@gmail.com",
        phone: "+91 1234567890",
        avatar: "/avatars/default.png",
        address: {
            street: "asdf",
            city: "Vadodara",
            state: "Gujarat",
            zipCode: "12345",
            country: "India",
        },
        workInfo: {
            company: "ESG",
            position: "Intern",
            department: "Engineering",
            employeeId: "ESG123",
        },
    };

    return (
        <>
            <NextTopLoader color="#4ade80" height={3} showSpinner={false} />
            <Navbar />
            <div className="mx-auto  bg-gray-50">
                <div className="relative overflow-hidden pt-24 pb-12 lg:pt-32 ">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Avatar>
                            <AvatarImage src={userData.avatar} alt={userData.name} />
                            <AvatarFallback>{userData.name}</AvatarFallback>
                        </Avatar>
                        <div className="mt-6 text-center">
                            <h1 className="text-3xl font-bold text-gray-900">{userData.name}</h1>
                            <p className="text-sm font-medium text-gray-500">{userData.email}</p>
                        </div>
                    </div>
                </div>
                {/* //profile tabs */}
                <div>
                    <Tabs className="space-y-4 w-full" defaultValue="personal">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="personal">Personal</TabsTrigger>
                            <TabsTrigger value="address">Address</TabsTrigger>
                            <TabsTrigger value="work">Work</TabsTrigger>
                        </TabsList>
                        <TabsContent value="personal">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between leading-none">
                                    <CardTitle>Personal</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 space-y-1 ">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Name</label>
                                            <p className="text-lg">{userData.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Email</label>
                                            <p className="text-lg">{userData.email}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Phone</label>
                                            <p className="text-lg">{userData.phone}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Email</label>
                                            <p className="text-lg">{userData.email}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="address">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between leading-none">
                                    <CardTitle>Address</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="groid grid-cols-1 gap-4 space-y-1 ">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Street</label>
                                            <p className="text-lg">{userData.address.street}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">City</label>
                                            <p className="text-lg">{userData.address.city}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">State</label>
                                            <p className="text-lg">{userData.address.state}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Zip Code</label>
                                            <p className="text-lg">{userData.address.zipCode}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Country</label>
                                            <p className="text-lg">{userData.address.country}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="work">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between leading-none">
                                    <CardTitle>Work</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="grid grid-cols-1 gap-4 space-y-1 ">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Company</label>
                                            <p className="text-lg">{userData.workInfo.company}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Position</label>
                                            <p className="text-lg">{userData.workInfo.position}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Department</label>
                                            <p className="text-lg">{userData.workInfo.department}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Employee ID</label>
                                            <p className="text-lg">{userData.workInfo.employeeId}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </div>

            </div>
        </>
    )
};

export default ProfilePage;