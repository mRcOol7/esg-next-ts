"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ReduxProvider } from "./ReduxProvider";
import { AuthStateSync } from "@/components/auth/AuthStateSync";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReduxProvider>
      <SessionProvider>
        <AuthStateSync />
        {children}
      </SessionProvider>
    </ReduxProvider>
  );
}