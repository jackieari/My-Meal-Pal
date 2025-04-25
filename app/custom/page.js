"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Calendar, Camera, ChevronDown, LogOut, Menu, User, X, Zap } from "lucide-react"

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

export default function CustomRecipes() {
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    ingredients: "",
    bio: "",
    instructions: "",
    prepTime: "",
  })
  const [recipes, setRecipes] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(true) // Toggle between recipe creation and search
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

  useEffect(() => {
    fetchUserInfo()
    fetchRecipes()

    const clickOutside = (e) => {
      if (settingsOpen && !e.target.closest(".settings-dropdown")) setSettingsOpen(false)
      if (dropdownOpen && !e.target.closest(".nav-dropdown")) setDropdownOpen(false)
    }

    document.addEventListener("mousedown", clickOutside)
    return () => document.removeEventListener("mousedown", clickOutside)
  }, [settingsOpen, dropdownOpen])

  const fetchUserInfo = async () => {
    let token = null
    const cookies = document.cookie.split(";").map((c) => c.trim())

    for (const cookie of cookies) {
      if (cookie.startsWith("access-token=")) token = cookie.substring("access-token=".length)
      else if (cookie.startsWith("token=")) token = cookie.substring("token=".length)
      else if (cookie.startsWith("next-auth.session-token="))
        token = cookie.substring("next-auth.session-token=".length)
      else if (cookie.startsWith("session=")) token = cookie.substring("session=".length)
    }

    token ||= localStorage.getItem("token") || localStorage.getItem("access-token")
    if (!token) return

    const res = await fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })

    if (res.ok) {
      const data = await res.json()
      setUserEmail(data.user?.email || "")
      setUserName(data.user?.name || "")
    }
  }

  const fetchRecipes = async () => {
    try {
      const res = await fetch("/api/custom-recipes")
      const data = await res.json()
      setRecipes(data)
    } catch (err) {
      console.error("Failed to fetch recipes:", err)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      ingredients: formData.ingredients.split(",").map((i) => i.trim()),
      userEmail,
    }

    const res = await fetch("/api/custom-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setFormData({
        title: "",
        ingredients: "",
        bio: "",
        instructions: "",
        prepTime: "",
      })
      fetchRecipes()
      setIsCreating(false) // Switch to the search view after successful submission
    } else {
      console.error("Failed to submit recipe")
    }
  }

  const deleteRecipe = async (recipeId) => {
    try {
      const res = await fetch(`/api/custom-recipes/${recipeId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        // Refresh the recipes list after deletion
        fetchRecipes()
      } else {
        console.error("Failed to delete recipe")
      }
    } catch (err) {
      console.error("Error deleting recipe:", err)
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

  // Filtered recipes based on search term
  const filteredRecipes = recipes.filter(
    (recipe) => recipe.title.toLowerCase().includes(searchTerm) || recipe.prepTime.toLowerCase().includes(searchTerm),
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
                      isActive("/recipes") || isActive("/liked-recipes") || isActive("/custom")
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

      <div className="p-6 space-y-8">
        <div className="mt-4 text-center">
          <h1 className="text-3xl font-semibold">Custom Recipes</h1>
          {userEmail ? (
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              <strong>Create and Save Your Custom Recipes!</strong>
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mt-2">Fetching user info...</p>
          )}
        </div>

        {/* Recipe Creation Section */}
        {isCreating ? (
          <div className="max-w-3xl mx-auto space-y-6 transition-all">
            <h2 className="text-2xl font-semibold text-center">Create a New Recipe</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Recipe Name"
                value={formData.title}
                onChange={handleChange}
                className="border p-3 w-full rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
              <input
                type="text"
                name="ingredients"
                placeholder="Ingredients (comma-separated)"
                value={formData.ingredients}
                onChange={handleChange}
                className="border p-3 w-full rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
              <input
                type="text"
                name="bio"
                placeholder="Short description"
                value={formData.bio}
                onChange={handleChange}
                className="border p-3 w-full rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              <textarea
                name="instructions"
                placeholder="Instructions"
                value={formData.instructions}
                onChange={handleChange}
                className="border p-3 w-full rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
                rows={5}
              />
              <input
                type="text"
                name="prepTime"
                placeholder="Prep Time (e.g. 15 minutes)"
                value={formData.prepTime}
                onChange={handleChange}
                className="border p-3 w-full rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
              <div className="flex gap-4">
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg w-1/2">
                  Submit Recipe
                </button>
                <button
                  type="button"
                  onClick={fetchRecipes}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg w-1/2"
                >
                  Refresh Recipes
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Switch back to Recipe Creation */}
        {!isCreating && (
          <div className="text-center mt-4">
            <button
              onClick={() => setIsCreating(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg"
            >
              Go Back to Create Recipe
            </button>
          </div>
        )}

        {/* Search Bar Section */}
        <div className="mt-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-4">Search Recipes</h2>
          <input
            type="text"
            placeholder="Search by recipe name or prep time"
            value={searchTerm}
            onChange={handleSearch}
            className="border border-gray-300 dark:border-gray-700 p-3 w-full rounded-lg dark:bg-gray-800 dark:text-white"
          />
          <div className="mt-4 text-center text-gray-700 dark:text-gray-300">
            <p>
              {filteredRecipes.length} {filteredRecipes.length === 1 ? "result" : "results"} found
            </p>
          </div>
        </div>

        {/* Recipe List (Side-by-side layout) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <div
                key={recipe._id}
                className="border p-6 rounded-lg shadow-md bg-white dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{recipe.title}</h3>
                  <button
                    onClick={() => deleteRecipe(recipe._id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    aria-label="Delete recipe"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{recipe.bio}</p>
                <p className="mt-4 text-gray-800 dark:text-gray-200">
                  <strong>Prep Time:</strong> {recipe.prepTime}
                </p>
                <p className="mt-2 text-gray-800 dark:text-gray-200">
                  <strong>Ingredients:</strong> {recipe.ingredients.join(", ")}
                </p>
                <p className="mt-4 text-gray-800 dark:text-gray-200">{recipe.instructions}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 col-span-full">No recipes found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
