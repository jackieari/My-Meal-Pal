"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { Calendar, Camera, ChevronDown, Info, LogOut, Menu, Upload, User, X, Zap } from "lucide-react"

const dayCode = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()]
const num = (v) => Number.parseFloat(v)

function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null) // ← NEW
  const [userName, setUserName] = useState("")
  const [dietaryRestrictions, setDietaryRestrictions] = useState([])
  const [allergens, setAllergens] = useState([])
  const [calorieLimit, setCalorieLimit] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [uploadStatus, setUploadStatus] = useState("")

  const [todayMeals, setTodayMeals] = useState([])
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })

  // New state for recipe suggestions
  const [recipeSuggestions, setRecipeSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

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
          setUser(d.user || null) // ← ADD THIS LINE
          setUserName(d.user?.name || "")
          const p = d.user?.nutritionalPreferences || {}
          setDietaryRestrictions(p.dietaryRestrictions || [])
          setAllergens(p.allergens || [])
          setCalorieLimit(p.calorieLimit || "")
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

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/meal-plan", { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        const today = data.plan?.find((d) => d.day === dayCode)
        if (!today) return
        setTodayMeals(today.meals || [])
        const t = today.meals.reduce(
          (a, m) => ({
            calories: a.calories + num(m.macros.calories),
            protein: a.protein + num(m.macros.protein),
            carbs: a.carbs + num(m.macros.carbs),
            fat: a.fat + num(m.macros.fat),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        )
        setTotals(t)
      } catch {}
    })()
  }, [])

  // New effect to fetch personalized recipe suggestions
  useEffect(() => {
    const fetchRecipeSuggestions = async () => {
      if (!userName) return // Only fetch if user is logged in

      setLoadingSuggestions(true)
      try {
        const res = await fetch("/api/recipe-suggestions", {
          credentials: "include",
        })

        if (!res.ok) {
          throw new Error("Failed to fetch recipe suggestions")
        }

        const data = await res.json()
        if (data.success && data.suggestions) {
          setRecipeSuggestions(data.suggestions)
        }
      } catch (error) {
        console.error("Error fetching recipe suggestions:", error)
        // Use fallback suggestions if API fails
        setRecipeSuggestions(getFallbackSuggestions())
      } finally {
        setLoadingSuggestions(false)
      }
    }

    fetchRecipeSuggestions()
  }, [userName, dietaryRestrictions, allergens])

  // Fallback suggestions if API fails
  const getFallbackSuggestions = () => {
    return [
      {
        id: 1,
        title: "Mediterranean Salad",
        image: "/placeholder.svg?height=200&width=300",
        readyInMinutes: 15,
        calories: 320,
        protein: 12,
        carbs: 25,
        fat: 18,
        matchedDietaryRestrictions: dietaryRestrictions,
        matchedAllergens: allergens,
      },
      {
        id: 2,
        title: "Grilled Chicken Bowl",
        image: "/placeholder.svg?height=200&width=300",
        readyInMinutes: 25,
        calories: 450,
        protein: 35,
        carbs: 40,
        fat: 15,
        matchedDietaryRestrictions: dietaryRestrictions,
        matchedAllergens: allergens,
      },
    ]
  }

  const handleImageChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      setSelectedImage(f)
      setPreviewUrl(URL.createObjectURL(f))
    }
  }

  const toBase64 = (f) =>
    new Promise((r, j) => {
      const rd = new FileReader()
      rd.readAsDataURL(f)
      rd.onload = () => r(rd.result)
      rd.onerror = (e) => j(e)
    })

  const handleImageUpload = async () => {
    if (!selectedImage) {
      setUploadStatus("Please select an image first")
      return
    }
    if (!userName) {
      setUploadStatus("User not authenticated")
      return
    }
    setUploadStatus("Uploading...")
    try {
      const img = await toBase64(selectedImage)
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, date: new Date().toISOString(), image: img }),
        credentials: "include",
      })
      if (res.ok) {
        setUploadStatus("Image uploaded successfully!")
        setSelectedImage(null)
        setPreviewUrl("")
        router.push("/upload-fridge")
      } else {
        const e = await res.json()
        setUploadStatus(e.message || "Failed to upload image")
      }
    } catch {
      setUploadStatus("An unexpected error occurred")
    }
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

  const toggleSettings = () => setSettingsOpen(!settingsOpen)
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)

  const isActive = (path) => {
    return pathname === path
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full border-4 border-t-blue-700 border-gray-200 animate-spin"></div>
          <p className="text-gray-800 dark:text-gray-200 font-medium">Loading your meal plan...</p>
        </div>
      </div>
    )

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
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

      <main className="container mx-auto px-4 py-8">
        {/* Top Section - Summary Dashboard */}
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-300 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-6">
            {/* User Profile Summary */}
            <div className="md:w-1/3 flex flex-col md:border-r md:dark:border-gray-700 pr-0 md:pr-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-700 dark:text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{userName || "Welcome"}</h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {calorieLimit ? `${calorieLimit} calories/day` : "Set your calorie goal"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {dietaryRestrictions.length > 0 &&
                  dietaryRestrictions.map((r, i) => (
                    <span
                      key={i}
                      className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {r}
                    </span>
                  ))}
                {allergens.length > 0 &&
                  allergens.map((a, i) => (
                    <span
                      key={i}
                      className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                      {a.replace(/-/g, " ")}
                    </span>
                  ))}
              </div>

              <Link
                href="/profile"
                className="text-sm font-medium text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 mt-auto"
              >
                Edit profile →
              </Link>
            </div>

            {/* Daily Nutrition Summary */}
            <div className="md:w-2/3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Nutrition</h2>
                <Link
                  href="/nutrition"
                  className="text-sm font-medium text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400"
                >
                  View details →
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Calories</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {totals.calories}/{calorieLimit || "2000"}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (totals.calories / (calorieLimit || 2000)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Protein</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {totals.protein}g/{user?.nutrionalPreferences?.macros?.protein || "110"}g
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(100, (totals.protein / (user?.nutrionalPreferences?.macros?.protein || 110)) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Carbs</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {totals.carbs}g/{user?.nutrionalPreferences?.macros?.carbs || "200"}g
                      </span>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(100, (totals.carbs / (user?.nutrionalPreferences?.macros?.carbs || 110)) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Fat</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {totals.fat}g/{user?.nutrionalPreferences?.macros?.fat || "60"}g
                      </span>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full" 
                     style={{ width: `${Math.min(100, (totals.carbs / (user?.nutrionalPreferences?.macros?.fat || 50)) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Meal Plan Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-300 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {dayCode === "Sun" || dayCode === "Sat" ? "This Weekend's Meal Plan" : "Today's Meal Plan"}
                </h2>
                <Link
                  href="/meal-plan"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400"
                >
                  Plan Meals
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {todayMeals.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    // Group meals by title
                    const groupedMeals = todayMeals.reduce((acc, meal) => {
                      const existingMeal = acc.find((m) => m.title === meal.title)
                      if (existingMeal) {
                        existingMeal.count += 1
                      } else {
                        acc.push({ ...meal, count: 1 })
                      }
                      return acc
                    }, [])

                    return groupedMeals.map((m, i) => (
                      <div
                        key={m.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors p-4 flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-blue-700 dark:text-blue-500">Meal {i + 1}</h3>
                          <div className="flex items-center gap-2">
                            {m.count > 1 && (
                              <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                                {m.count}x per day
                              </span>
                            )}
                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                              {m.macros.calories}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-900 dark:text-white font-medium mb-auto">{m.title}</p>

                        <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                          <span>Protein: {m.macros.protein}</span>
                          <span>Carbs: {m.macros.carbs}</span>
                          <span>Fat: {m.macros.fat}</span>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                  <Calendar className="h-10 w-10 mx-auto text-gray-500 dark:text-gray-500 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 mb-3">No meal plan saved for today yet.</p>
                  <Link
                    href="/meal-plan"
                    className="inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Create Meal Plan
                  </Link>
                </div>
              )}
            </div>

            {/* Recipe Suggestions */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-300 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recipe Suggestions</h2>
                <Link
                  href="/recipes"
                  className="text-sm font-medium text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400"
                >
                  View all →
                </Link>
              </div>

              {loadingSuggestions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700"
                    >
                      <div className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-md mb-3 animate-pulse"></div>
                      <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recipeSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recipeSuggestions.slice(0, 4).map((recipe) => (
                    <Link
                      href={`/recipes/${recipe.id}`}
                      key={recipe.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-md mb-3 relative overflow-hidden">
                        <Image
                          src={recipe.image || "/placeholder.svg?height=200&width=300"}
                          alt={recipe.title}
                          fill
                          className="object-cover"
                        />
                        {recipe.matchedDietaryRestrictions?.length > 0 && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                            {recipe.matchedDietaryRestrictions[0]}
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium mb-1 text-gray-900 dark:text-white">{recipe.title}</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Matches your {dietaryRestrictions.length > 0 ? "dietary preferences" : "preferences"}
                        {allergens.length > 0 ? " and allergen restrictions" : ""}
                      </p>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-700 dark:text-gray-300">{Math.round(recipe.calories)} calories</span>
                        <span className="text-blue-700 dark:text-blue-500">{recipe.readyInMinutes} min</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                    <div className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-md mb-3"></div>
                    <h3 className="font-medium mb-1 text-gray-900 dark:text-white">Mediterranean Salad</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Fresh and healthy option with olives and feta
                    </p>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-700 dark:text-gray-300">320 calories</span>
                      <span className="text-blue-700 dark:text-blue-500">15 min</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                    <div className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-md mb-3"></div>
                    <h3 className="font-medium mb-1 text-gray-900 dark:text-white">Grilled Chicken Bowl</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      High protein meal with quinoa and vegetables
                    </p>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-700 dark:text-gray-300">450 calories</span>
                      <span className="text-blue-700 dark:text-blue-500">25 min</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Fridge Scan Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Fridge Scan</h2>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center relative">
                  {previewUrl ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={previewUrl || "/placeholder.svg"}
                        alt="Fridge contents preview"
                        fill
                        className="object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setPreviewUrl("")
                          setSelectedImage(null)
                        }}
                        className="absolute top-2 right-2 bg-gray-900/70 rounded-full p-1 text-white hover:bg-gray-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-8">
                      <Camera className="h-10 w-10 mx-auto text-gray-500 dark:text-gray-500" />
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        Take a photo of your fridge contents
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Click or drag and drop</p>
                    </div>
                  )}
                  <label htmlFor="fridge-image-upload" className="absolute inset-0 cursor-pointer">
                    <span className="sr-only">Upload fridge image</span>
                  </label>
                  <input
                    id="fridge-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <button
                  onClick={handleImageUpload}
                  disabled={!selectedImage}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition duration-200 ${
                    selectedImage
                      ? "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Analyze Ingredients
                </button>

                {uploadStatus && (
                  <p
                    className={`text-sm text-center font-medium ${
                      uploadStatus === "Uploading..."
                        ? "text-amber-600 dark:text-amber-400"
                        : uploadStatus.includes("success")
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Weekly Progress */}
            {/* <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Weekly Progress</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Calorie Goals Met</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">5/7 days</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: "71%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Protein Goals Met</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">4/7 days</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: "57%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Water Intake</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">6/7 days</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
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

export default HomePage
