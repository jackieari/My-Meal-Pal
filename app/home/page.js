"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

function HomePage() {
  const router = useRouter()
  // User state
  const [userName, setUserName] = useState("")
  const [dietaryRestrictions, setDietaryRestrictions] = useState([])
  const [calorieLimit, setCalorieLimit] = useState("")
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [uploadStatus, setUploadStatus] = useState("")

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
          setUserName(data.user.name)
          setDietaryRestrictions(data.user.nutritionalPreferences.dietaryRestrictions || [])
          setCalorieLimit(data.user.nutritionalPreferences.calorieLimit || "")
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

  // Handle image selection
    const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  // Convert image to Base64
  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  
  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) {
      setUploadStatus("Please select an image first");
      return;
    }
  
    if (!userName) {
      setUploadStatus("User not authenticated");
      return;
    }
  
    setUploadStatus("Uploading...");
  
    try {
      const base64Image = await toBase64(selectedImage);
      const date = new Date().toISOString(); // Current timestamp
  
      const response = await fetch("/api/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userName, // Use userName from state
          date,
          image: base64Image,
        }),
      });
  
      if (response.ok) {
        setUploadStatus("Image uploaded successfully!");
        setSelectedImage(null);
        setPreviewUrl("");
        router.push("/upload-fridge"); // Redirect after successful upload
      } else {
        const errorData = await response.json();
        setUploadStatus(errorData.message || "Failed to upload image");
      }
    } catch (err) {
      setUploadStatus("An unexpected error occurred");
      console.error(err);
    }
  };  

  // Handle logout
  const handleLogout = () => {
    // Clear the authentication token cookie
    document.cookie = "access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    // Clear any other auth-related cookies or local storage items
    localStorage.removeItem("user")
    sessionStorage.removeItem("user")

    // Redirect to login page
    router.push("/")
  }

  // Toggle settings dropdown
  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Navigation Bar */}
      <nav className="bg-gray-800 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Meal Pal</h1>

          <div className="flex items-center space-x-6">
            <Link href="/meal-planner" className="text-white hover:text-blue-300">
              Meal Planner
            </Link>
            <Link href="/recipes" className="text-white hover:text-blue-300">
              Recipes
            </Link>
            <Link href="/upload-fridge" className="text-white hover:text-blue-300">
              Fridge Image Upload
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Upload and profile */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile summary */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Your Profile</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400">Name</p>
                  <p className="font-medium">{userName}</p>
                </div>
                <div>
                  <p className="text-gray-400">Dietary Restrictions</p>
                  {dietaryRestrictions.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dietaryRestrictions.map((restriction, index) => (
                        <span key={index} className="bg-purple-500 px-2 py-1 rounded-full text-xs">
                          {restriction}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm">None specified</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-400">Daily Calorie Goal</p>
                  <p className="font-medium">{calorieLimit || "Not set"}</p>
                </div>
              </div>
            </div>

            {/* Ingredient Recognition & Recipe Suggestions */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-2">Fridge Scan</h2>
              <p className="text-sm text-gray-400 mb-4">
                Upload a photo of your fridge contents to get recipe suggestions based on available ingredients.
              </p>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center relative">
                  {previewUrl ? (
                    <div className="relative h-48 w-full">
                      <Image
                        src={previewUrl || "/placeholder.svg"}
                        alt="Fridge contents preview"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ) : (
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-400">Take a photo of your fridge contents</p>
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
                  className={`w-full py-2 rounded transition duration-300 ${
                    selectedImage ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 cursor-not-allowed"
                  }`}
                >
                  Analyze Ingredients & Find Recipes
                </button>

                {uploadStatus && (
                  <p
                    className={`text-sm text-center ${
                      uploadStatus === "Uploading..."
                        ? "text-yellow-400"
                        : uploadStatus.includes("success")
                          ? "text-green-400"
                          : "text-red-400"
                    }`}
                  >
                    {uploadStatus}
                  </p>
                )}

                {/* Coming soon badge */}
                <div className="mt-2 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-md p-2 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-xs text-blue-300">
                    <span className="font-semibold">Coming Soon:</span> AI-powered ingredient recognition and
                    personalized recipe suggestions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Meal plan and nutrition */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's meal plan */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Today's Meal Plan</h2>
                <div className="flex items-center gap-2">
                  <button className="p-1 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>
                  <Link href="/meal-planner" className="text-blue-400 hover:underline text-sm">
                    Plan Meals →
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-300">Meal 1</h3>
                  <p className="mt-2">Oatmeal with Berries</p>
                  <p className="text-sm text-gray-400">320 calories</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-300">Meal 2</h3>
                  <p className="mt-2">Chicken Salad</p>
                  <p className="text-sm text-gray-400">450 calories</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-300">Meal 3</h3>
                  <p className="mt-2">Salmon with Vegetables</p>
                  <p className="text-sm text-gray-400">580 calories</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-500 text-sm">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-400"
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
                    <p className="font-medium">Daily Summary</p>
                    <p className="text-gray-300">Total Calories: 1350 / {calorieLimit || "2000"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nutrition insights */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Nutrition Insights</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-green-300">Protein</h3>
                  <div className="mt-2 h-2 bg-gray-600 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: "65%" }}></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">65% of daily goal</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-300">Carbs</h3>
                  <div className="mt-2 h-2 bg-gray-600 rounded-full">
                    <div className="h-2 bg-yellow-500 rounded-full" style={{ width: "40%" }}></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">40% of daily goal</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-300">Fats</h3>
                  <div className="mt-2 h-2 bg-gray-600 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: "55%" }}></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">55% of daily goal</p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <Link href="/nutrition" className="text-blue-400 hover:underline text-sm">
                  View Detailed Nutrition →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomePage
