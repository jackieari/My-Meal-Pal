"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Calendar,
  Camera,
  ChevronDown,
  ChevronUp,
  Check,
  LogOut,
  Menu,
  RefreshCw,
  UtensilsCrossed,
  User,
  X,
  Zap,
} from "lucide-react"

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

export default function Page() {
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const [openDay, setOpenDay] = useState(null)
  const [loading, setLoading] = useState(false)
  const [swapOptions, setSwapOptions] = useState({
    isOpen: false,
    day: null,
    mealId: null,
    options: [],
  })
  const [userName, setUserName] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const router = useRouter()
  const pathname = usePathname()

  const isActive = (path) => {
    return pathname === path
  }

  const toggleSettings = () => setSettingsOpen(!settingsOpen)
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)

  // In the Page component, add this line near the top with the other constants
  const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()]

  /* ---------- helpers ---------- */
  /**
   * Aggregate identical meals so repeated recipes are shown once with a servings badge.
   * @param {Array} meals
   * @returns {Array} with added `servings` property
   */
  const aggregateMeals = (meals) => {
    const map = {}
    meals.forEach((m) => {
      const key = m.id || m.title
      if (!map[key]) {
        map[key] = { ...m, servings: 1 }
      } else {
        map[key].servings += 1
      }
    })
    return Object.values(map)
  }

  // Toggle function to open/close a day
  const toggleDay = (day) => {
    setOpenDay((prev) => (prev === day ? null : day))
  }

  // Replace the fetchMealPlan function with this updated version
  // Fetch meal plan data
  const fetchMealPlan = async () => {
    try {
      const res = await fetch("/api/meal-plan")
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setPlan(data.plan)

      // Automatically open the current day when data loads
      if (data.plan && data.plan.length > 0) {
        // Check if current day exists in the plan
        const dayExists = data.plan.some((day) => day.day === currentDay)
        if (dayExists) {
          setOpenDay(currentDay)
        } else {
          // Fall back to the first day if current day isn't in the plan
          setOpenDay(data.plan[0].day)
        }
      }
    } catch (e) {
      setError(e.message)
    }
  }

  // Fetch swap options
  const fetchSwapOptions = async (day, mealId) => {
    setLoading(true)
    try {
      const res = await fetch("/api/meal-plan/swap-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, mealId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to get meal options")
      setSwapOptions({ isOpen: true, day, mealId, options: data.options || [] })
    } catch (e) {
      setError(e.message || "Error getting meal options")
      // demo fallback
      setSwapOptions({ isOpen: true, day, mealId, options: generateFallbackOptions() })
    } finally {
      setLoading(false)
    }
  }

  // Fallback options (demo)
  const generateFallbackOptions = () => [
    {
      id: "option1",
      title: "Grilled Chicken Salad",
      image: "/placeholder.svg?height=200&width=300",
      macros: { calories: 350, protein: 30, carbs: 15, fat: 18 },
    },
    {
      id: "option2",
      title: "Vegetable Stir Fry",
      image: "/placeholder.svg?height=200&width=300",
      macros: { calories: 280, protein: 12, carbs: 40, fat: 8 },
    },
    {
      id: "option3",
      title: "Salmon with Roasted Vegetables",
      image: "/placeholder.svg?height=200&width=300",
      macros: { calories: 420, protein: 35, carbs: 20, fat: 22 },
    },
  ]

  // Confirm swap
  const confirmSwap = async (optionId) => {
    setLoading(true)
    try {
      const res = await fetch("/api/meal-plan/confirm-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: swapOptions.day, mealId: swapOptions.mealId, optionId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to swap meal")
      setPlan(data.plan)
      closeSwapOptions()
    } catch (e) {
      setError(e.message || "Error swapping meal")
      simulateSuccessfulSwap(optionId) // demo
    } finally {
      setLoading(false)
    }
  }

  // Demo swap
  const simulateSuccessfulSwap = (optionId) => {
    if (!plan) return
    const selected = swapOptions.options.find((o) => o.id === optionId)
    if (!selected) return
    const newPlan = plan.map((day) => {
      if (day.day !== swapOptions.day) return day
      const meals = day.meals.map((m) => (m.id === swapOptions.mealId ? { ...selected, id: selected.id } : m))
      return { ...day, meals }
    })
    setPlan(newPlan)
    closeSwapOptions()
  }

  const closeSwapOptions = () => setSwapOptions({ isOpen: false, day: null, mealId: null, options: [] })

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

  // Fetch user info and meal plan
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
          return
        }
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })
        if (res.ok) {
          const d = await res.json()
          setUserName(d.user?.name || "")
        }
      } catch (error) {
        console.error("Error fetching user info:", error)
      }
    }

    fetchUserInfo()
    fetchMealPlan()

    const clickOutside = (e) => {
      if (settingsOpen && !e.target.closest(".settings-dropdown")) setSettingsOpen(false)
      if (dropdownOpen && !e.target.closest(".nav-dropdown")) setDropdownOpen(false)
    }

    document.addEventListener("mousedown", clickOutside)
    return () => document.removeEventListener("mousedown", clickOutside)
  }, [settingsOpen, dropdownOpen])

  /* ---------- UI states (error, loading, empty) ---------- */
  if (error)
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
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
            <div className="shrink-0 bg-red-100 dark:bg-red-900/40 p-2 rounded-full">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    )

  if (!plan)
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
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="h-7 w-7 text-blue-700 dark:text-blue-500" />
            <span>Weekly Meal Plan</span>
          </h1>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((idx) => (
              <div key={idx} className="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )

  /* ---------- MAIN RENDER ---------- */
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

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {!plan.length ? (
          <div className="text-center">
            <div className="py-12 px-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 inline-flex rounded-full p-4 mb-4">
                <Calendar className="h-8 w-8 text-blue-700 dark:text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">No meal plan yet</h2>
              <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
                You haven't created a meal plan yet. Start planning your meals for a healthier week ahead.
              </p>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Calendar className="h-7 w-7 text-blue-700 dark:text-blue-500" />
                <span>Weekly Meal Plan</span>
              </h1>
              <p className="text-gray-700 dark:text-gray-300 mt-2">Click on a day to view meals</p>
            </header>

            <div className="space-y-4">
              {plan.map((d) => {
                const meals = aggregateMeals(d.meals) // *** aggregated ***
                return (
                  <div
                    key={d.day}
                    className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
                  >
                    {/* Day button */}
                    <button
                      onClick={() => toggleDay(d.day)}
                      className={`w-full p-4 text-left font-medium flex items-center justify-between transition-colors ${
                        openDay === d.day
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                      }`}
                    >
                      <span className="text-lg">{d.day}</span>
                      {openDay === d.day ? (
                        <ChevronUp className="h-5 w-5 text-blue-700 dark:text-blue-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>

                    {/* Meal list */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        openDay === d.day ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
                        {meals.map((m) => (
                          <div
                            key={m.id || m.title}
                            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden transition-all hover:shadow-md"
                          >
                            <div className="flex flex-col sm:flex-row">
                              <div className="sm:w-24 sm:h-24 h-40 relative">
                                <img
                                  src={m.image || "/placeholder.svg"}
                                  alt={m.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-lg text-gray-900 dark:text-white">{m.title}</h3>
                                    {m.servings > 1 && (
                                      <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200">
                                        x{m.servings}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      fetchSwapOptions(d.day, m.id)
                                    }}
                                    disabled={loading}
                                    className={`ml-2 p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors ${
                                      loading ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    title="Swap for another meal"
                                  >
                                    <RefreshCw
                                      className={`h-4 w-4 ${loading && swapOptions.mealId === m.id ? "animate-spin" : ""}`}
                                    />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    {m.macros.calories} Cal
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                                    {m.macros.protein}g Protein
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    {m.macros.carbs}g Carbs
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                                    {m.macros.fat}g Fat
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ---------- Swap modal ---------- */}
            {swapOptions.isOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Choose a replacement meal</h3>
                    <button
                      onClick={closeSwapOptions}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-4 overflow-y-auto max-h-[70vh]">
                    <div className="space-y-4">
                      {swapOptions.options.map((o) => (
                        <div
                          key={o.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
                          onClick={() => confirmSwap(o.id)}
                        >
                          <div className="flex flex-col sm:flex-row">
                            <div className="sm:w-32 sm:h-32 h-48 relative">
                              <img
                                src={o.image || "/placeholder.svg"}
                                alt={o.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-4 flex-1">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-medium text-lg text-gray-900 dark:text-white">{o.title}</h4>
                                <button
                                  className="ml-2 p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    confirmSwap(o.id)
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  {o.macros.calories} Cal
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                                  {o.macros.protein}g Protein
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  {o.macros.carbs}g Carbs
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                                  {o.macros.fat}g Fat
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                      onClick={closeSwapOptions}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
g