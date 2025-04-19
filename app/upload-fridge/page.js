"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Camera, ChevronDown, LogOut, Menu, Plus, Settings, Upload, User, X, Zap } from "lucide-react"
import axios from "axios"

export default function FridgeUploadPage() {
  const [fridgeImages, setFridgeImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [userName, setUserName] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ingredients, setIngredients] = useState([])
  const [newIngredient, setNewIngredient] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const router = useRouter()

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

        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })

        if (res.ok) {
          const data = await res.json()
          setUserName(data.user?.name || "")
        } else {
          console.error("Failed to fetch user data")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()

    const clickOutside = (e) => settingsOpen && !e.target.closest(".settings-dropdown") && setSettingsOpen(false)
    document.addEventListener("mousedown", clickOutside)
    return () => document.removeEventListener("mousedown", clickOutside)
  }, [settingsOpen])

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

  const toggleImageSelection = (img) => {
    if (selectedImage === img) {
      setSelectedImage(null)
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
      <header className="sticky top-0 z-40 w-full border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-700 dark:text-blue-500" />
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
                className="text-sm font-medium text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 transition-colors"
              >
                Fridge Scan
              </Link>

              {/* Settings Dropdown */}
              <div className="relative settings-dropdown">
                <button
                  onClick={toggleSettings}
                  className="flex items-center gap-1 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{userName || "Account"}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {settingsOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-200 dark:border-gray-700">
                    <div className="py-2 px-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Signed in as</p>
                      <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{userName}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <User className="h-4 w-4" />
                        Your Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </div>
                    <div className="py-1 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <LogOut className="h-4 w-4" />
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
              <Menu className="h-6 w-6" />
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
                <Zap className="h-6 w-6 text-blue-700 dark:text-blue-500" />
                <span className="font-bold text-xl">MealPal</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="rounded-md p-1 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col space-y-6">
              <Link
                href="/meal-planner"
                className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-500" />
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
                className="flex items-center gap-3 text-base font-medium text-blue-700 dark:text-blue-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Camera className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                Fridge Scan
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 text-base font-medium text-red-600 dark:text-red-500"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fridge Scan</h1>
          <p className="text-gray-700 dark:text-gray-300">Select an image of your fridge contents for analysis</p>
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
                    onClick={() => setSelectedImage(null)}
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
                    onClick={() => toggleImageSelection(image)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === image
                        ? "border-blue-600 dark:border-blue-500 shadow-md"
                        : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                    }`}
                  >
                    <div className="w-40 h-40 relative">
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
