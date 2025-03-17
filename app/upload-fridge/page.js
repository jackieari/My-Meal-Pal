"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function MultiImageSelectionPage() {
  const [fridgeImages, setFridgeImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [userName, setUserName] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/users/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${document.cookie.replace("access-token=", "")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Fetched user data:", data)
          setUserName(data.user.name)
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

    // Close settings dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (settingsOpen && !event.target.closest(".settings-dropdown")) {
        setSettingsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [settingsOpen])

  // Fetch fridge images for the user
  useEffect(() => {
    const fetchImages = async () => {
      if (!userName) {
        console.log("No user name set")
        return
      }

      try {
        const url = `/api/images?name=${userName}`
        console.log("Fetching images from URL:", url)

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          console.log("Fetched images:", data)
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

  // Toggle settings dropdown
  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen)
  }

  // Handle logout
  const handleLogout = () => {
    // Clear the authentication token cookie
    document.cookie = "access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    // Clear any other auth-related cookies or local storage items
    localStorage.removeItem("user")
    sessionStorage.removeItem("user")

    // Redirect to login page
    router.push("/login")
  }

  // Toggle image selection
  const toggleImageSelection = (img) => {
    setSelectedImages((prevSelected) => {
      if (prevSelected.includes(img)) {
        return prevSelected.filter((image) => image !== img)
      } else {
        return [...prevSelected, img]
      }
    })
  }

  // Navigate to analysis page with selected images
  const analyzeSelectedImages = () => {
    if (selectedImages.length === 0) return
    const imageUrls = selectedImages.map((img) => encodeURIComponent(img.image)).join(",")
    router.push(`/analyze-fridge?images=${imageUrls}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  // For demo purposes, create some mock images if none are returned from API
  const mockImages =
    fridgeImages.length > 0
      ? fridgeImages
      : [
          { id: 1, image: "/placeholder.svg?height=300&width=300", date: "2023-03-10" },
          { id: 2, image: "/placeholder.svg?height=300&width=300", date: "2023-03-09" },
          { id: 3, image: "/placeholder.svg?height=300&width=300", date: "2023-03-08" },
          { id: 4, image: "/placeholder.svg?height=300&width=300", date: "2023-03-07" },
          { id: 5, image: "/placeholder.svg?height=300&width=300", date: "2023-03-06" },
          { id: 6, image: "/placeholder.svg?height=300&width=300", date: "2023-03-05" },
          { id: 7, image: "/placeholder.svg?height=300&width=300", date: "2023-03-04" },
          { id: 8, image: "/placeholder.svg?height=300&width=300", date: "2023-03-03" },
          { id: 9, image: "/placeholder.svg?height=300&width=300", date: "2023-03-02" },
          { id: 10, image: "/placeholder.svg?height=300&width=300", date: "2023-03-01" },
          { id: 11, image: "/placeholder.svg?height=300&width=300", date: "2023-02-28" },
          { id: 12, image: "/placeholder.svg?height=300&width=300", date: "2023-02-27" },
        ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-800 p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Meal Pal</h1>

          <div className="flex items-center space-x-6">
            <Link href="/" className="text-white hover:text-blue-300">
              Home
            </Link>
            <Link href="/meal-planner" className="text-white hover:text-blue-300">
              Meal Planner
            </Link>
            <Link href="/nutrition" className="text-white hover:text-blue-300">
              Nutrition
            </Link>

            {/* Settings Icon */}
            <div className="relative settings-dropdown">
              <button
                onClick={toggleSettings}
                className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={settingsOpen}
                aria-haspopup="true"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium">Signed in as</p>
                    <p className="text-sm font-bold truncate">{userName}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-700">
                    Your Profile
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm hover:bg-gray-700">
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 focus:outline-none"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Image Selection</h1>
          <p className="text-gray-400">Select multiple fridge images for comprehensive analysis</p>
        </div>

        {/* Best Practices Guidance */}
        <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-400 mr-3 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-300 mb-1">Recommendation for Optimal Results</h3>
              <p className="text-gray-300 text-sm">
                For the most accurate ingredient recognition and recipe suggestions, we recommend organizing your
                refrigerator before taking photos. Ensure items are clearly visible, not stacked or hidden behind other
                items, and adequately lit. This will significantly enhance our ability to identify ingredients and
                provide relevant recipe recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Image Selection Grid */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Fridge Images</h2>
              <span className="text-sm text-gray-400">
                {selectedImages.length} of {mockImages.length} selected
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {mockImages.map((img, index) => (
                <div
                  key={index}
                  onClick={() => toggleImageSelection(img)}
                  className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedImages.includes(img)
                      ? "ring-2 ring-blue-500 transform scale-[1.05]"
                      : "hover:ring-1 hover:ring-blue-400 hover:transform hover:scale-[1.01]"
                  }`}
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      src={img.image || "/placeholder.svg"}
                      alt={`Fridge ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent ${
                      selectedImages.includes(img) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    } transition-opacity duration-200`}
                  ></div>
                  <div className="absolute bottom-0 left-0 right-0 p-1 text-[10px] text-white">
                    {img.date ? new Date(img.date).toLocaleDateString() : `Image ${index + 1}`}
                  </div>
                  {selectedImages.includes(img) && (
                    <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {mockImages.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No fridge images found. Upload your first image below.</p>
              </div>
            )}
          </div>

          {/* Selected Images Preview */}
          {selectedImages.length > 0 ? (
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Selected Images</h2>
              <div className="flex flex-wrap gap-4 mb-6">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative">
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                      <Image
                        src={img.image || "/placeholder.svg"}
                        alt={`Selected ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={() => toggleImageSelection(img)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={analyzeSelectedImages}
                disabled={selectedImages.length === 0}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Analyze Selected Images ({selectedImages.length})
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
              <h3 className="text-lg font-medium mb-2">No Images Selected</h3>
              <p className="text-gray-400">Select one or more images from the gallery above to analyze them together</p>
            </div>
          )}

          {/* Upload New Image Section */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Upload New Image</h2>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center relative hover:border-blue-500 transition-colors duration-200">
              <div className="py-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-gray-400">Drag and drop an image or click to browse</p>
                <p className="mt-1 text-xs text-gray-500">Supported formats: JPG, PNG, WEBP</p>
              </div>
              <label htmlFor="fridge-image-upload" className="absolute inset-0 cursor-pointer">
                <span className="sr-only">Upload fridge image</span>
              </label>
              <input id="fridge-image-upload" type="file" accept="image/*" className="hidden" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

