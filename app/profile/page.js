"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User,
  Settings,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Calculator,
  Check,
  Zap,
  Menu,
  X,
  LogOut,
  Calendar,
  Camera,
  ArrowLeft

} from "lucide-react"
import { calculateCalories } from "@/lib/calorie-calculator"

export default function ProfilePage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [dietaryRestrictions, setDietaryRestrictions] = useState([])
  const [calorieLimit, setCalorieLimit] = useState("")
  const [allergens, setAllergens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCalorieCalculator, setShowCalorieCalculator] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Body metrics state
  const [bodyMetrics, setBodyMetrics] = useState({
    gender: "female",
    dob: "",
    currentWeight: "",
    goalWeight: "",
    heightFeet: "5",
    heightInches: "6",
    activityLevel: "moderate",
    fitnessGoal: "lose",
    weeklyGoal: "1",
  })

  // Calculated calorie data
  const [calculatedCalories, setCalculatedCalories] = useState(null)

  const toggleSettings = () => setSettingsOpen(!settingsOpen)
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)

  const handleLogout = () => {
    document.cookie = "access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    localStorage.removeItem("access-token")
    sessionStorage.removeItem("user")
    router.push("/login")
  }

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        console.log("Fetching user info...")

        // Check for the access token in cookies
        const cookies = document.cookie.split(";")
        let accessToken = null

        // Log all cookies for debugging
        console.log("Available cookies on client:", cookies)

        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split("=")
          if (name === "access-token") {
            accessToken = value
            console.log("Found access-token cookie in client:", accessToken.substring(0, 10) + "...")
            break
          }
        }

        if (!accessToken) {
          console.warn("No access-token cookie found on client")
        }

        const response = await fetch("/api/users/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
          credentials: "include", // Send cookies automatically
        })

        console.log("User info response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("User data received")

          setUserName(data.user.name || "")

          // Set dietary restrictions as array
          const restrictions = data.user.nutritionalPreferences?.dietaryRestrictions || []
          setDietaryRestrictions(restrictions)

          // Set calorie limit
          setCalorieLimit(data.user.nutritionalPreferences?.calorieLimit || "")

          // Set allergens as array
          const userAllergens = data.user.nutritionalPreferences?.allergens || []
          setAllergens(userAllergens)

          // If user has body metrics saved, load them
          if (data.user.bodyMetrics) {
            setBodyMetrics({
              gender: data.user.bodyMetrics.gender || "female",
              dob: data.user.bodyMetrics.dob || "",
              currentWeight: data.user.bodyMetrics.currentWeight || "",
              goalWeight: data.user.bodyMetrics.goalWeight || "",
              heightFeet: data.user.bodyMetrics.heightFeet || "5",
              heightInches: data.user.bodyMetrics.heightInches || "6",
              activityLevel: data.user.bodyMetrics.activityLevel || "moderate",
              fitnessGoal: data.user.bodyMetrics.fitnessGoal || "lose",
              weeklyGoal: data.user.bodyMetrics.weeklyGoal || "1",
            })
          }
        } else {
          let errorMessage = "Failed to fetch user data"
          try {
            const errorData = await response.json()
            console.error("Failed to fetch user data:", errorData)
            errorMessage = errorData.message || errorMessage
          } catch (jsonError) {
            console.error("Error parsing error response:", jsonError)
          }
          setError(errorMessage)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError("An error occurred while fetching your data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()

    const clickOutside = (e) => settingsOpen && !e.target.closest(".settings-dropdown") && setSettingsOpen(false)
    document.addEventListener("mousedown", clickOutside)
    return () => document.removeEventListener("mousedown", clickOutside)
  }, [settingsOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      console.log("Submitting profile update...")

      // Check for the access token in cookies
      const cookies = document.cookie.split(";")
      let accessToken = null

      // Log all cookies for debugging
      console.log("Available cookies on submit:", cookies)

      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=")
        if (name === "access-token") {
          accessToken = value
          console.log("Found access-token cookie:", accessToken.substring(0, 10) + "...")
          break
        }
      }

      if (!accessToken) {
        console.error("No access-token cookie found")
        setError("Authentication token not found. Please log in again.")
        return
      }

      // Prepare the payload
      const payload = {
        dietaryRestrictions,
        calorieLimit: calorieLimit ? Number(calorieLimit) : null,
        allergens,
      }

      if (showCalorieCalculator && bodyMetrics) {
        payload.bodyMetrics = bodyMetrics
      }

      console.log("Request payload:", payload)

      // Include both cookie and header authentication for maximum compatibility
      const response = await fetch("/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // Also send as header
        },
        credentials: "include", // Send cookies
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        setSuccessMessage("Profile updated successfully!")
      } else {
        let errorMessage = "Failed to update profile"
        try {
          const errorData = await response.json()
          console.error("Update failed:", errorData)
          errorMessage = errorData.message || errorMessage
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError)
        }
        setError(errorMessage)
      }
    } catch (err) {
      console.error("Error during update:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBodyMetricsChange = (field, value) => {
    setBodyMetrics((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const calculateNewCalories = () => {
    const calorieData = calculateCalories({
      ...bodyMetrics,
      allergens,
      dietaryRestrictions,
    })
    setCalculatedCalories(calorieData)
    setCalorieLimit(calorieData.dailyCalories)
  }

  // Handle allergen selection
  const handleAllergenToggle = (allergen) => {
    setAllergens((prev) => {
      if (prev.includes(allergen)) {
        return prev.filter((a) => a !== allergen)
      } else {
        return [...prev, allergen]
      }
    })
  }

  // Handle dietary restriction selection
  const handleDietaryToggle = (restriction) => {
    setDietaryRestrictions((prev) => {
      if (prev.includes(restriction)) {
        return prev.filter((r) => r !== restriction)
      } else {
        return [...prev, restriction]
      }
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full border-4 border-t-blue-700 dark:border-t-blue-500 border-gray-200 dark:border-gray-700 animate-spin"></div>
          <p className="text-gray-800 dark:text-gray-200 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // Common allergens list
  const allergenOptions = [
    { id: "dairy", label: "Dairy" },
    { id: "eggs", label: "Eggs" },
    { id: "peanuts", label: "Peanuts" },
    { id: "tree-nuts", label: "Tree Nuts" },
    { id: "soy", label: "Soy" },
    { id: "wheat", label: "Wheat/Gluten" },
    { id: "fish", label: "Fish" },
    { id: "shellfish", label: "Shellfish" },
    { id: "sesame", label: "Sesame" },
  ]

  // Dietary restriction options
  const dietaryOptions = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "pescatarian", label: "Pescatarian" },
    { id: "keto", label: "Keto" },
    { id: "paleo", label: "Paleo" },
    { id: "gluten-free", label: "Gluten-Free" },
    { id: "dairy-free", label: "Dairy-Free" },
    { id: "low-carb", label: "Low Carb" },
  ]

  return (
      <div
          className="relative flex flex-col items-center min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 md:p-8">
        {/* Back to Home Link - Now positioned with z-index to ensure visibility */}
        <Link
            href="/home"
            className="fixed top-20 left-4 z-50 flex items-center text-blue-700 dark:text-blue-500 hover:underline bg-white dark:bg-gray-900 px-3 py-2 rounded-md shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 mr-1"/>
          Back to Home
        </Link>

        {/* Header */}
        <header
            className="fixed top-0 left-0 right-0 z-40 w-full border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-blue-700 dark:text-blue-500"/>
                  <span className="font-bold text-xl">MyMealPal</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                    href="/meal-planner"
                    className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  Meal Planner
                </Link>
                <Link
                    href="/recipes"
                    className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  Recipes
                </Link>
                <Link
                    href="/upload-fridge"
                    className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  Fridge Scan
                </Link>

                {/* Settings Dropdown */}
                <div className="relative settings-dropdown">
                  <button
                      onClick={toggleSettings}
                      className="flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 transition-colors"
                  >
                    <User className="h-4 w-4"/>
                    <span>{userName || "Account"}</span>
                    <ChevronDown className="h-4 w-4"/>
                  </button>

                  {settingsOpen && (
                      <div
                          className="absolute right-0 mt-2 w-56 rounded-md bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-200 dark:border-gray-700">
                        <div className="py-2 px-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
                          <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{userName}</p>
                        </div>
                        <div className="py-1">
                          <Link
                              href="/profile"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-700 dark:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <User className="h-4 w-4"/>
                            Your Profile
                          </Link>
                          <Link
                              href="/settings"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Settings className="h-4 w-4"/>
                            Settings
                          </Link>
                        </div>
                        <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                          <button
                              onClick={handleLogout}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <LogOut className="h-4 w-4"/>
                            Sign out
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              </nav>

              {/* Mobile Menu Button */}
              <button
                  onClick={toggleMobileMenu}
                  className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              >
                <Menu className="h-6 w-6"/>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-gray-950/90 md:hidden">
              <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-gray-900 shadow-lg p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Zap className="h-6 w-6 text-blue-700 dark:text-blue-500"/>
                    <span className="font-bold text-xl">MealPal</span>
                  </div>
                  <button
                      onClick={toggleMobileMenu}
                      className="rounded-md p-1 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-6 w-6"/>
                  </button>
                </div>
                <nav className="flex flex-col space-y-6">
                  <Link
                      href="/meal-planner"
                      className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
                      onClick={() => setMobileMenuOpen(false)}
                  >
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-500"/>
                    Meal Planner
                  </Link>
                  <Link
                      href="/recipes"
                      className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
                      onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg
                        className="h-5 w-5 text-blue-600 dark:text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Recipes
                  </Link>
                  <Link
                      href="/upload-fridge"
                      className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
                      onClick={() => setMobileMenuOpen(false)}
                  >
                    <Camera className="h-5 w-5 text-blue-600 dark:text-blue-500"/>
                    Fridge Scan
                  </Link>
                  <Link
                      href="/profile"
                      className="flex items-center gap-3 text-base font-medium text-blue-700 dark:text-blue-500"
                      onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-500"/>
                    Your Profile
                  </Link>
                  <Link
                      href="/settings"
                      className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
                      onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 text-blue-600 dark:text-blue-500"/>
                    Settings
                  </Link>
                  <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 text-base font-medium text-red-600 dark:text-red-500"
                  >
                    <LogOut className="h-5 w-5"/>
                    Sign out
                  </button>
                </nav>
              </div>
            </div>
        )}

        <div className="w-full max-w-2xl">
          <header className="mb-6 mt-12 text-center">
            <div
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <User className="h-8 w-8 text-blue-700 dark:text-blue-500"/>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Welcome, {userName}</h1>
            <p className="text-gray-700 dark:text-gray-300">Manage your profile and nutrition settings</p>
          </header>

          <div
              className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-300 dark:border-gray-700 overflow-hidden mb-6">
            {error && (
                <div
                    className="m-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0"/>
                  <p>{error}</p>
                </div>
            )}

            {successMessage && (
                <div
                    className="m-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2">
                  <div
                      className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3"/>
                  </div>
                  <p>{successMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-gray-300 dark:border-gray-700 pb-2 text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-700 dark:text-blue-500"/>
                  Nutritional Preferences
                </h2>

                {/* Calorie Limit */}
                <div>
                  <label
                      htmlFor="calorieLimit"
                      className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200"
                  >
                    Daily Calorie Target
                  </label>
                  <input
                      type="number"
                      id="calorieLimit"
                      value={calorieLimit}
                      onChange={(e) => setCalorieLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                  />
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                    Dietary Restrictions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {dietaryOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <input
                              type="checkbox"
                              id={`diet-${option.id}`}
                              checked={dietaryRestrictions.includes(option.id)}
                              onChange={() => handleDietaryToggle(option.id)}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-700 dark:text-blue-500 focus:ring-blue-700 dark:focus:ring-blue-500"
                          />
                          <label htmlFor={`diet-${option.id}`} className="text-sm text-gray-800 dark:text-gray-200">
                            {option.label}
                          </label>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Allergens */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                    Food Allergens
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {allergenOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <input
                              type="checkbox"
                              id={`allergen-${option.id}`}
                              checked={allergens.includes(option.id)}
                              onChange={() => handleAllergenToggle(option.id)}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-700 dark:text-blue-500 focus:ring-blue-700 dark:focus:ring-blue-500"
                          />
                          <label htmlFor={`allergen-${option.id}`} className="text-sm text-gray-800 dark:text-gray-200">
                            {option.label}
                          </label>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Food Allergens Display */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Allergens</p>
                  {allergens && allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {allergens.map((allergen, index) => (
                            <span
                                key={index}
                                className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800"
                            >
                        {allergen.replace(/-/g, " ")}
                      </span>
                        ))}
                      </div>
                  ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">None specified</p>
                  )}
                </div>
              </div>

              {/* Calorie Calculator Toggle */}
              <div className="pt-4 border-t border-gray-300 dark:border-gray-700">
                <button
                    type="button"
                    onClick={() => setShowCalorieCalculator(!showCalorieCalculator)}
                    className="text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 flex items-center gap-2 text-sm font-medium"
                >
                  {showCalorieCalculator ? (
                      <>
                        <ChevronUp className="h-4 w-4"/>
                        Hide Calorie Calculator
                      </>
                  ) : (
                      <>
                        <ChevronDown className="h-4 w-4"/>
                        Recalculate My Calories
                      </>
                  )}
                </button>
              </div>

              {/* Body Metrics for Calorie Calculation */}
              {showCalorieCalculator && (
                  <div className="space-y-4 pt-2 border-t border-gray-300 dark:border-gray-700">
                    <h2 className="text-xl font-semibold pb-2 pt-2 text-gray-900 dark:text-white flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-700 dark:text-blue-500"/>
                      Body Metrics
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Gender */}
                      <div>
                        <label htmlFor="gender"
                               className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                          Gender
                        </label>
                        <select
                            id="gender"
                            value={bodyMetrics.gender}
                            onChange={(e) => handleBodyMetricsChange("gender", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                        >
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label htmlFor="dob"
                               className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                          Date of Birth
                        </label>
                        <input
                            type="date"
                            id="dob"
                            value={bodyMetrics.dob}
                            onChange={(e) => handleBodyMetricsChange("dob", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Weight */}
                      <div>
                        <label
                            htmlFor="currentWeight"
                            className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200"
                        >
                          Current Weight (lbs)
                        </label>
                        <input
                            type="number"
                            id="currentWeight"
                            value={bodyMetrics.currentWeight}
                            onChange={(e) => handleBodyMetricsChange("currentWeight", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                        />
                      </div>

                      {/* Goal Weight */}
                      <div>
                        <label
                            htmlFor="goalWeight"
                            className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200"
                        >
                          Goal Weight (lbs)
                        </label>
                        <input
                            type="number"
                            id="goalWeight"
                            value={bodyMetrics.goalWeight}
                            onChange={(e) => handleBodyMetricsChange("goalWeight", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Height */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">Height</label>
                      <div className="flex gap-2">
                        <select
                            value={bodyMetrics.heightFeet}
                            onChange={(e) => handleBodyMetricsChange("heightFeet", e.target.value)}
                            className="w-1/2 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                        >
                          {Array.from({length: 8}, (_, i) => i + 4).map((feet) => (
                              <option key={feet} value={feet.toString()}>
                                {feet} ft
                              </option>
                          ))}
                        </select>
                        <select
                            value={bodyMetrics.heightInches}
                            onChange={(e) => handleBodyMetricsChange("heightInches", e.target.value)}
                            className="w-1/2 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                        >
                          {Array.from({length: 12}, (_, i) => i).map((inches) => (
                              <option key={inches} value={inches.toString()}>
                                {inches} in
                              </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Activity Level */}
                    <div>
                      <label
                          htmlFor="activityLevel"
                          className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200"
                      >
                        Activity Level
                      </label>
                      <select
                          id="activityLevel"
                          value={bodyMetrics.activityLevel}
                          onChange={(e) => handleBodyMetricsChange("activityLevel", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                      >
                        <option value="sedentary">Sedentary</option>
                        <option value="light">Lightly Active</option>
                        <option value="moderate">Moderately Active</option>
                        <option value="very">Very Active</option>
                        <option value="extra">Extra Active</option>
                      </select>
                    </div>

                    {/* Fitness Goal */}
                    <div>
                      <label
                          htmlFor="fitnessGoal"
                          className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200"
                      >
                        Your Fitness Goal
                      </label>
                      <select
                          id="fitnessGoal"
                          value={bodyMetrics.fitnessGoal}
                          onChange={(e) => {
                            const value = e.target.value
                            handleBodyMetricsChange("fitnessGoal", value)
                            // Reset weekly goal when changing fitness goal
                            const weeklyGoal =
                                value === "lose" ? "1" : value === "gain" ? "0.5" : value === "muscle" ? "0.25" : "0"
                            handleBodyMetricsChange("weeklyGoal", weeklyGoal)
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                      >
                        <option value="lose">Lose Weight</option>
                        <option value="maintain">Maintain Weight</option>
                        <option value="gain">Gain Weight</option>
                        <option value="muscle">Gain Muscle</option>
                      </select>
                    </div>

                    {/* Weekly Goal */}
                    {bodyMetrics.fitnessGoal !== "maintain" && (
                        <div>
                          <label
                              htmlFor="weeklyGoal"
                              className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200"
                          >
                            Weekly Goal
                          </label>
                          <select
                              id="weeklyGoal"
                              value={bodyMetrics.weeklyGoal}
                              onChange={(e) => handleBodyMetricsChange("weeklyGoal", e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
                          >
                            {bodyMetrics.fitnessGoal === "lose" ? (
                                <>
                                  <option value="0.5">Lose 0.5 lb per week</option>
                                  <option value="1">Lose 1 lb per week</option>
                                  <option value="1.5">Lose 1.5 lb per week</option>
                                  <option value="2">Lose 2 lb per week</option>
                                </>
                            ) : bodyMetrics.fitnessGoal === "gain" ? (
                                <>
                                  <option value="0.25">Gain 0.25 lb per week</option>
                                  <option value="0.5">Gain 0.5 lb per week</option>
                                  <option value="0.75">Gain 0.75 lb per week</option>
                                  <option value="1">Gain 1 lb per week</option>
                                </>
                            ) : (
                                <>
                                  <option value="0.25">Gain 0.25 lb of muscle per week</option>
                                  <option value="0.5">Gain 0.5 lb of muscle per week</option>
                                  <option value="0.75">Gain 0.75 lb of muscle per week</option>
                                </>
                            )}
                          </select>
                        </div>
                    )}

                    {/* Calculate Button */}
                    <div className="pt-2">
                      <button
                          type="button"
                          onClick={calculateNewCalories}
                          className="w-full py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
                      >
                        Calculate New Calorie Target
                      </button>
                    </div>

                    {/* Calculated Results */}
                    {calculatedCalories && (
                        <div
                            className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                            Your New Calorie Target
                          </h3>
                          <div className="text-3xl font-bold text-blue-700 dark:text-blue-500 mb-2">
                            {calculatedCalories.dailyCalories} calories
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Based on your metrics, we recommend {calculatedCalories.protein}g protein,{" "}
                            {calculatedCalories.carbs}g carbs, and {calculatedCalories.fat}g fat daily.
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            This target will be saved when you update your profile.
                          </p>
                        </div>
                    )}
                  </div>
              )}

              {/* Submit button */}
              <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 mt-6 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                    <>
                      <div
                          className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                      Updating...
                    </>
                ) : (
                    <>
                      <Save className="h-4 w-4"/>
                      Update Profile
                    </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
  )
}
