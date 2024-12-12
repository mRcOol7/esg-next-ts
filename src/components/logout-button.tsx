//logout button
"use client"

import { signOut } from "next-auth/react"
import { Button } from "./ui/button"

export default function LogoutButton() {
  return (
    <Button 
      variant="outline" 
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="border-red-600 text-red-600 hover:bg-red-50"
    >
      Log Out
    </Button>
  )
}
