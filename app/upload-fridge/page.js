"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Camera, ChevronDown, LogOut, Menu, Plus, Upload, User, X, Zap } from "lucide-react"
import axios from "axios"

export default function FridgeUploadPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [fridgeImages, setFridgeImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [userName, setUserName] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ingredients, setIngredients] = useState([])
  const [newIngredient, setNewIngredient] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
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

  useEffect(() => {
    const fetchImages = async () => {
      if (!userName) {
        console.log("No user name set")
        return
      }

      try {
        const url = `/api/images?name=${userName}`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setFridgeImages(data.images || [])
        } else {
          console.error("Failed to fetch images")
        }
      } catch (error) {
        console.error("Error fetching images:", error)
      }
    }

    if (userName) {
      fetchImages()
    }
  }, [userName])

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

  const toggleImageSelection = (img) => {
    if (selectedImage === img) {
      setSelectedImage(null)
      setIngredients([]) // Add this line to clear ingredients when deselecting
    } else {
      setSelectedImage(img)
    }
  }

  const analyzeSelectedImage = async () => {
    if (!selectedImage) return

    setAnalyzing(true)

    try {
      const imageUrl = selectedImage.image

      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const reader = new FileReader()
      reader.readAsDataURL(blob)

      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1]

        try {
          const res = await axios({
            method: "POST",
            url: "https://detect.roboflow.com/aicook-lcv4d/3",
            params: {
              api_key: "t37wtQdpUC2586fdcs4t", // Replace with your actual API key
            },
            data: base64Image,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          })

          if (res.data && Array.isArray(res.data.predictions)) {
            const detectedIngredients = res.data.predictions.map((prediction) => prediction.class)
            // Combine the new ingredients with the existing ones
            setIngredients((prevIngredients) => {
              const updatedIngredients = [...new Set([...prevIngredients, ...detectedIngredients])]
              return updatedIngredients
            })
          } else {
            console.log("No ingredients detected")
          }
        } catch (error) {
          console.error("Error with Roboflow API:", error.message)
        } finally {
          setAnalyzing(false)
        }
      }
    } catch (error) {
      console.error("Error processing image:", error)
      setAnalyzing(false)
    }
  }

  const handleDeleteIngredient = (ingredientToDelete) => {
    setIngredients(ingredients.filter((ingredient) => ingredient !== ingredientToDelete))
  }

  const handleAddIngredient = () => {
    if (newIngredient && !ingredients.includes(newIngredient)) {
      setIngredients((prevIngredients) => {
        // Add new ingredient and remove duplicates
        const updatedIngredients = [...prevIngredients, newIngredient]
        return [...new Set(updatedIngredients)]
      })
      setNewIngredient("")
    }
  }

  const handleSubmitIngredients = () => {
    console.log("Submitting Ingredients: ", ingredients)
    // Save detected ingredients
    localStorage.setItem("detectedIngredients", JSON.stringify(ingredients))
    // Redirect to the recipes page
    router.push("/recipes")
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-full border-4 border-t-blue-700 border-gray-200 animate-spin"></div>
          <p className="text-gray-800 dark:text-gray-200 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const mockImages =
    fridgeImages.length > 0
      ? fridgeImages
      : [
          { id: 1, image: "/placeholder.svg?height=300&width=300", date: "2023-03-10" },
          { id: 2, image: "/placeholder.svg?height=300&width=300", date: "2023-03-09" },
          { id: 3, image: "/placeholder.svg?height=300&width=300", date: "2023-03-08" },
          { id: 4, image: "/placeholder.svg?height=300&width=300", date: "2023-03-07" },
        ]

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
        <div className="mt-4 mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Fridge Scan</h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-xl mx-auto">
            Select an image of your fridge contents for analysis
          </p>
        </div>

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-300 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Selected Image</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-48 h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                <Image
                  src={selectedImage.image || "/placeholder.svg"}
                  alt="Selected Fridge"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-medium">Date:</span> {new Date(selectedImage.date).toLocaleDateString()}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedImage(null)
                      setIngredients([])
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    Deselect
                  </button>
                  <button
                    onClick={analyzeSelectedImage}
                    disabled={analyzing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-white transition-colors ${
                      analyzing ? "bg-gray-500 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
                    }`}
                  >
                    {analyzing ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Analyze Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Gallery - Horizontal Scrolling with visible scrollbar */}
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-300 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Fridge Images</h2>

          <div className="relative">
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="flex gap-4 min-w-max">
                {mockImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === image
                        ? "border-blue-600 dark:border-blue-500 shadow-md"
                        : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                    }`}
                  >
                    <div className="w-40 h-40 relative" onClick={() => toggleImageSelection(image)}>
                      <Image
                        src={image.image || "/placeholder.svg"}
                        alt={`Fridge Image ${image.id}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
                      {new Date(image.date).toLocaleDateString()}
                    </div>
                    {selectedImage === image && (
                      <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-white dark:from-gray-900 to-transparent w-12 h-full pointer-events-none"></div>
          </div>

          <style jsx global>{`
            /* Ultra-minimal scrollbar styling */
            .custom-scrollbar::-webkit-scrollbar {
              height: 2px;
              display: block;
            }

            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(241, 241, 241, 0.2);
              border-radius: 2px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(180, 180, 180, 0.3);
              border-radius: 2px;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(150, 150, 150, 0.4);
            }

            /* For Firefox */
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: rgba(180, 180, 180, 0.3) transparent;
            }

            /* For dark mode */
            @media (prefers-color-scheme: dark) {
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(30, 30, 30, 0.2);
              }

              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(100, 100, 100, 0.3);
              }

              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(120, 120, 120, 0.4);
              }

              .custom-scrollbar {
                scrollbar-color: rgba(100, 100, 100, 0.3) transparent;
              }
            }
          `}</style>
        </div>

        {/* Ingredients Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-300 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detected Ingredients</h2>

          {ingredients.length > 0 ? (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{ingredient}</span>
                    <button
                      onClick={() => handleDeleteIngredient(ingredient)}
                      className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 mb-6">
              <Camera className="h-10 w-10 mx-auto text-gray-500 dark:text-gray-500 mb-2" />
              <p className="text-gray-700 dark:text-gray-300 mb-1">No ingredients detected yet.</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select an image and click "Analyze Image" to detect ingredients.
              </p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add a new ingredient"
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleAddIngredient()}
              />
              <button
                onClick={handleAddIngredient}
                disabled={!newIngredient}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  !newIngredient
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800 text-white"
                }`}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSubmitIngredients}
              disabled={ingredients.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-white font-medium transition-colors ${
                ingredients.length === 0
                  ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800 shadow-sm"
              }`}
            >
              Find Recipes with These Ingredients
            </button>
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
