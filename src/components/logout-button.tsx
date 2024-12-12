//logout button
"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "./ui/button"
import { Loader2 } from "lucide-react"

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      await signOut({ callbackUrl: "/login" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleLogout}
      disabled={isLoading}
      className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-600"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging out...
        </>
      ) : (
        "Log Out"
      )}
    </Button>
  )
}
