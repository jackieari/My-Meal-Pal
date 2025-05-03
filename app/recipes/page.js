"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Calendar, Camera, ChevronDown, LogOut, Menu, User, X, Zap } from "lucide-react"
import ResultsClient from "./ResultsClient"

export default function RecipesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        let token = null
        const cookies = document.cookie.split(";").map((c) => c.trim())
        for (const c of cookies) {
          if (c.startsWith("access-token=")) token = c.slice(13)
          if (c.startsWith("token=")) token = c.slice(6)
          if (c.startsWith("next-auth.session-token=")) token = c.slice(24)
          if (c.startsWith("session=")) token = c.slice(8)
        }
        if (!token) token = localStorage.getItem("token") || localStorage.getItem("access-token")
        if (!token) {
          setError("Please log in to access this page")
          setLoading(false)
          setTimeout(() => router.push("/login"), 2000)
          return
        }
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })
        if (res.ok) {
          const d = await res.json()
          setUserName(d.user?.name || "")
        } else if (res.status === 401) {
          setError("Your session has expired. Please log in again.")
          setTimeout(() => router.push("/login"), 2000)
        } else setError("Failed to load user data. Please try again later.")
      } catch {
        setError("An unexpected error occurred. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchUserInfo()
    const clickOutside = (e) => {
      if (settingsOpen && !e.target.closest(".settings-dropdown")) setSettingsOpen(false)
      if (dropdownOpen && !e.target.closest(".nav-dropdown")) setDropdownOpen(false)
    }
    document.addEventListener("mousedown", clickOutside)
    return () => document.removeEventListener("mousedown", clickOutside)
  }, [settingsOpen, dropdownOpen, router])

  const toggleSettings = () => setSettingsOpen(!settingsOpen)
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)

  const isActive = (path) => {
    return pathname === path
  }

  const handleLogout = () => {
    document.cookie = "access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    localStorage.removeItem("access-token")
    sessionStorage.removeItem("user")
    router.push("/")
  }

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <X className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-gray-900 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/home" className="flex items-center gap-2 mr-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 rounded-lg p-1.5">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-900 dark:from-blue-500 dark:to-blue-400 bg-clip-text text-transparent">
                  MyMealPal
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                <NavLink href="/meal-plan" isActive={isActive("/meal-plan")} icon={<Calendar className="h-4 w-4" />}>
                  Meal Plan
                </NavLink>

                <div className="relative nav-dropdown">
                  <button
                    onClick={toggleDropdown}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/recipes") || isActive("/liked-recipes")
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    Recipes
                    <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 mt-1 w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <Link
                          href="/recipes"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Browse Recipes
                        </Link>
                        <Link
                          href="/liked-recipes"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Liked Recipes
                        </Link>
                        <Link
                          href="/custom"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Custom Recipes
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <NavLink href="/shopping" isActive={isActive("/shopping")}>
                  Grocery Items
                </NavLink>

                <NavLink
                  href="/upload-fridge"
                  isActive={isActive("/upload-fridge")}
                  icon={<Camera className="h-4 w-4" />}
                >
                  Fridge Scan
                </NavLink>
              </nav>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center gap-2">
              <div className="relative settings-dropdown">
                <button
                  onClick={toggleSettings}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-expanded={settingsOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-700 dark:text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">{userName || "Profile"}</span>
                </button>

                {settingsOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div
                      className="py-1 border-b border-gray-200 dark:border-gray-700"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                        onClick={() => setSettingsOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-500" />
                        Your Profile
                      </Link>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleLogout()
                          setSettingsOpen(false)
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950/90 lg:hidden">
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-900 shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 rounded-lg p-1.5">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-xl bg-gradient-to-r from-blue-700 to-blue-900 dark:from-blue-500 dark:to-blue-400 bg-clip-text text-transparent">
                    MyMealPal
                  </span>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* User profile section */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-700 dark:text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{userName || "Guest"}</p>
                    <Link
                      href="/profile"
                      className="text-sm text-blue-700 dark:text-blue-500"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  <MobileNavLink
                    href="/meal-plan"
                    icon={<Calendar className="h-5 w-5" />}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Meal Plan
                  </MobileNavLink>

                  <MobileNavLink href="/recipes" onClick={() => setMobileMenuOpen(false)}>
                    Browse Recipes
                  </MobileNavLink>

                  <MobileNavLink href="/liked-recipes" onClick={() => setMobileMenuOpen(false)}>
                    Liked Recipes
                  </MobileNavLink>

                  <MobileNavLink href="/custom" onClick={() => setMobileMenuOpen(false)}>
                    Custom Recipes
                  </MobileNavLink>

                  <MobileNavLink href="/shopping" onClick={() => setMobileMenuOpen(false)}>
                    Grocery Items
                  </MobileNavLink>

                  <MobileNavLink
                    href="/upload-fridge"
                    icon={<Camera className="h-5 w-5" />}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Fridge Scan
                  </MobileNavLink>
                </div>
              </nav>

              {/* Footer actions */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">Your Personalized Meal Suggestions</h2>
        <ResultsClient />
      </main>
    </div>
  )
}

// Navigation link component for desktop
function NavLink({ href, children, icon, isActive }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {icon && <span className="text-blue-700 dark:text-blue-500">{icon}</span>}
      {children}
    </Link>
  )
}

// Navigation link component for mobile
function MobileNavLink({ href, children, icon, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {icon && <span className="text-blue-700 dark:text-blue-500">{icon}</span>}
      {children}
    </Link>
  )
}
