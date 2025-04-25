"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { Calendar, Camera, ChevronDown, Heart, LogOut, Loader2, Menu, User, Wand2, X, Zap } from "lucide-react"

/* ──────────── helper functions ──────────── */
const macro = (r, name) => Math.round(r.nutrition?.nutrients?.find((n) => n.name === name)?.amount ?? 0)

const label = (v, u) => `${v}${u}`
const shuffle = (a) => a.sort(() => Math.random() - 0.5)
const err = (tot, goal) =>
  ["calories", "protein", "carbs", "fat"].reduce((s, k) => s + Math.abs(tot[k] - goal[k]) / goal[k], 0)

/*  Tailwind's JIT compiler only keeps explicit class names,            */
/*  so we map the `color` prop to real classes it can see.              */
const COLOR_MAP = {
  blue: "bg-blue-600  hover:bg-blue-700",
  emerald: "bg-emerald-600 hover:bg-emerald-700",
  gray: "bg-gray-600  hover:bg-gray-700",
}

/* ─────────── reusable little UI pieces ─────────── */
const Btn = ({ children, onClick, disabled, icon, color = "blue" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-2 rounded-md text-white transition-colors
                disabled:bg-gray-400 ${COLOR_MAP[color] ?? COLOR_MAP.blue}`}
  >
    {icon}
    {children}
  </button>
)

const Badge = ({ children }) => (
  <span
    className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800
                   dark:bg-blue-900/30 dark:text-blue-300
                   border border-blue-200 dark:border-blue-800"
  >
    {children}
  </span>
)

const Center = ({ children, error }) => (
  <section
    className={`flex flex-col items-center justify-center min-h-[300px] p-8 ${
      error ? "text-red-600 dark:text-red-400" : ""
    }`}
  >
    {children}
  </section>
)

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

/* ────────────────────────────────────────────────── */
export default function LikedRecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [picked, setPicked] = useState(new Set())
  const [goals, setGoals] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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

  /* -------- fetch liked recipes & daily macro goals -------- */
  useEffect(() => {
    ;(async () => {
      try {
        const [rLiked, rGoals] = await Promise.all([fetch("/api/liked-recipes"), fetch("/api/users/goals")])
        if (!rLiked.ok) throw new Error(await rLiked.text())
        if (!rGoals.ok) throw new Error(await rGoals.text())

        const liked = await rLiked.json()
        const g = await rGoals.json()

        if (!liked.success) throw new Error(liked.error)

        setRecipes(liked.recipes)
        setGoals({
          calories: Math.round(g.calorieLimit),
          protein: Math.round(g.macros.protein),
          carbs: Math.round(g.macros.carbs),
          fat: Math.round(g.macros.fat),
        })
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Fetch user info
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

    const clickOutside = (e) => {
      if (settingsOpen && !e.target.closest(".settings-dropdown")) setSettingsOpen(false)
      if (dropdownOpen && !e.target.closest(".nav-dropdown")) setDropdownOpen(false)
    }

    document.addEventListener("mousedown", clickOutside)
    return () => document.removeEventListener("mousedown", clickOutside)
  }, [settingsOpen, dropdownOpen])

  /* ------------- save a week-plan to Mongo ---------------- */
  async function savePlan(meals) {
    const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      meals: meals.map((m) => ({
        id: m.id,
        title: m.title,
        image: m.image,
        macros: {
          calories: label(macro(m, "Calories"), " cal"),
          protein: label(macro(m, "Protein"), " g"),
          carbs: label(macro(m, "Carbohydrates"), " g"),
          fat: label(macro(m, "Fat"), " g"),
        },
      })),
    }))

    await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: week }),
    })
  }

  /* -------------- auto-generator algorithm ---------------- */
  function autoGenerate(pool, goal) {
    /* decorate with numeric macros for quick maths */
    const decorated = shuffle(pool).map((r) => ({
      ...r,
      nums: {
        calories: macro(r, "Calories"),
        protein: macro(r, "Protein"),
        carbs: macro(r, "Carbohydrates"),
        fat: macro(r, "Fat"),
      },
    }))

    const chosen = []
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const used = new Map() // recipeId → servings
    const maxServ = 3
    const steps = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5]

    const needMoreCalories = () => totals.calories < goal.calories * 0.95
    const fits = (obj, cap) =>
      ["calories", "protein", "carbs", "fat"].every((k) => totals[k] + obj.nums[k] <= goal[k] * (1 + cap))

    /* Pass 1: unique recipes only */
    for (const cap of steps) {
      let added = true
      while (added && needMoreCalories()) {
        added = false
        const cand = decorated.find((r) => !used.has(r.id) && fits(r, cap))
        if (cand) {
          pick(cand)
          added = true
        }
      }
      if (!needMoreCalories()) break
    }

    /* Pass 2: allow duplicates up to maxServ each */
    for (const cap of steps) {
      let added = true
      while (added && needMoreCalories()) {
        added = false
        const cand = decorated
          .filter((r) => (used.get(r.id) || 0) < maxServ)
          .sort((a, b) => b.nums.calories - a.nums.calories)
          .find((r) => fits(r, cap))

        if (cand) {
          pick(cand)
          added = true
        }
      }
      if (!needMoreCalories()) break
    }

    /* Pass 3: small swaps to minimise macro error        */
    refine(chosen, decorated, totals, goal, used, maxServ)
    return chosen

    /* helper: pick/record one serving of a recipe */
    function pick(rec) {
      chosen.push(rec)
      Object.keys(totals).forEach((k) => (totals[k] += rec.nums[k]))
      used.set(rec.id, (used.get(rec.id) || 0) + 1)
    }
  }

  /* ---------- simple local swap-refinement ---------- */
  function refine(chosen, pool, totals, goal, used, maxServ) {
    const MAX = 40,
      CAP = 0.5 // never exceed 150 % of any macro

    for (let i = 0; i < MAX; i++) {
      let bestGain = 0,
        repIdx = -1,
        repCand = null

      chosen.forEach((sel, idx) => {
        pool.forEach((cand) => {
          if (cand.id === sel.id && (used.get(cand.id) || 0) >= maxServ) return

          const newTotals = {
            calories: totals.calories - sel.nums.calories + cand.nums.calories,
            protein: totals.protein - sel.nums.protein + cand.nums.protein,
            carbs: totals.carbs - sel.nums.carbs + cand.nums.carbs,
            fat: totals.fat - sel.nums.fat + cand.nums.fat,
          }
          const bust = Object.keys(newTotals).some((k) => newTotals[k] > goal[k] * (1 + CAP))
          if (bust) return

          const gain = err(totals, goal) - err(newTotals, goal)
          if (gain > bestGain + 1e-6) {
            bestGain = gain
            repIdx = idx
            repCand = cand
          }
        })
      })

      if (bestGain <= 0) break // nothing better
      const out = chosen[repIdx]

      used.set(out.id, used.get(out.id) - 1)
      used.set(repCand.id, (used.get(repCand.id) || 0) + 1)
      Object.keys(totals).forEach((k) => (totals[k] += repCand.nums[k] - out.nums[k]))
      chosen[repIdx] = repCand
    }
  }

  /* ---------------- button actions ------------------ */
  const createAutoPlan = async () => {
    if (busy || !goals) return
    setBusy(true)
    try {
      const meals = autoGenerate(recipes, goals)
      if (!meals.length) throw new Error("Your liked recipes can't satisfy those targets.")
      await savePlan(meals)
      router.push("/meal-plan")
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const createSelectedPlan = async () => {
    if (busy || picked.size === 0) return
    setBusy(true)
    try {
      await savePlan(recipes.filter((r) => picked.has(r.id)))
      router.push("/meal-plan")
    } catch (e) {
      setError(e.message)
      setBusy(false)
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

  /* ---------------- render -------------------------- */
  if (loading)
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
        <Center>
          <Loader2 className="h-10 w-10 animate-spin" />
        </Center>
      </div>
    )

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
        <Center error>
          <p>{error}</p>
        </Center>
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
        {!recipes.length ? (
          <Center>
            <Heart className="h-10 w-10 text-blue-600 mb-3" />
            <p>No liked recipes yet.</p>
          </Center>
        ) : (
          <>
            <div className="max-w-7xl mx-auto">
              {/* Page title */}
              <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Heart className="h-6 w-6 text-blue-700" />
                Your Liked Recipes
              </h1>

              {/* Controls */}
              <div className="mb-6 flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-900 border rounded-lg">
                <span className="text-sm">
                  {picked.size ? `${picked.size} selected` : "Tick recipes for manual plan"}
                </span>

                <Btn
                  onClick={createSelectedPlan}
                  disabled={busy || picked.size === 0}
                  icon={
                    busy && picked.size ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Calendar className="h-4 w-4" />
                    )
                  }
                >
                  Create Plan (Selected)
                </Btn>

                <Btn
                  color="emerald"
                  onClick={createAutoPlan}
                  disabled={busy}
                  icon={
                    busy && !picked.size ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />
                  }
                >
                  Auto-Generate Plan
                </Btn>
              </div>

              {/* Recipe grid */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((r) => (
                  <li
                    key={r.id}
                    className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md bg-white dark:bg-gray-900"
                  >
                    <div className="relative w-full h-48">
                      <Image
                        src={
                          r.image ?? `https://spoonacular.com/recipeImages/${r.id || "/placeholder.svg"}-636x393.jpg`
                        }
                        alt={r.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      <h2 className="text-lg font-semibold">{r.title}</h2>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge>{label(macro(r, "Calories"), " cal")}</Badge>
                        <Badge>{label(macro(r, "Protein"), " g")} protein</Badge>
                        <Badge>{label(macro(r, "Carbohydrates"), " g")} carbs</Badge>
                        <Badge>{label(macro(r, "Fat"), " g")} fat</Badge>
                      </div>

                      <label className="flex items-center gap-2 text-sm mt-2">
                        <input
                          type="checkbox"
                          checked={picked.has(r.id)}
                          onChange={(e) =>
                            setPicked((prev) => {
                              const next = new Set(prev)
                              e.target.checked ? next.add(r.id) : next.delete(r.id)
                              return next
                            })
                          }
                        />
                        Select for manual plan
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
