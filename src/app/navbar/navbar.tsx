"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import LogoutButton from "@/components/logout-button"

const navItems = [
  {
    title: "Home",
    href: "/home",
    description: "Dashboard overview"
  },
  {
    title: "Profile",
    href: "/profile",
    description: "Manage your account settings and preferences."
  }
]

const Navbar = () => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const { status, data: session } = useSession()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-green-700 flex items-center">
            ESG
          </Link>

          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMenu}
              className="text-gray-600 hover:text-green-700"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                  pathname === item.href 
                    ? "bg-green-100 text-green-800" 
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {status === "loading" ? (
              <div className="w-20 h-10 bg-gray-100 animate-pulse rounded-md" />
            ) : session ? (
              <LogoutButton />
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {isMenuOpen && (
            <div className="fixed inset-0 top-[65px] bg-white md:hidden z-40 overflow-y-auto">
              <div className="flex flex-col items-center space-y-2 px-4 py-4 bg-gray-50 min-h-screen">
                {navItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href}
                    onClick={toggleMenu}
                    className={cn(
                      "w-full text-center py-4 text-lg font-medium transition-all duration-200 bg-white rounded-lg shadow-sm",
                      pathname === item.href 
                        ? "bg-green-50 text-green-800 font-semibold shadow-md" 
                        : "text-gray-700 hover:bg-green-50/50 hover:text-green-700"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{item.title}</span>
                      <span className="text-xs text-gray-500 font-normal">{item.description}</span>
                    </div>
                  </Link>
                ))}
                
                <div className="flex flex-col space-y-3 w-full px-4 pt-6 mt-4">
                  <Link href="/login" onClick={toggleMenu} className="w-full">
                    <Button 
                      variant="outline" 
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 transition-all duration-200 shadow-sm"
                    >
                      Log In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={toggleMenu} className="w-full">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-sm"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="h-[65px]" />
    </>
  )
}

export default Navbar