"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const dayCode = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
const num = (v) => parseFloat(v);

function HomePage() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [calorieLimit, setCalorieLimit] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const [todayMeals, setTodayMeals] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        let token = null;
        const cookies = document.cookie.split(";").map((c) => c.trim());
        for (const c of cookies) {
          if (c.startsWith("access-token=")) token = c.slice(13);
          if (c.startsWith("token=")) token = c.slice(6);
          if (c.startsWith("next-auth.session-token=")) token = c.slice(24);
          if (c.startsWith("session=")) token = c.slice(8);
        }
        if (!token) token = localStorage.getItem("token") || localStorage.getItem("access-token");
        if (!token) {
          setError("Please log in to access this page");
          setLoading(false);
          setTimeout(() => router.push("/login"), 2000);
          return;
        }
        const res = await fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
        if (res.ok) {
          const d = await res.json();
          setUserName(d.user?.name || "");
          const p = d.user?.nutritionalPreferences || {};
          setDietaryRestrictions(p.dietaryRestrictions || []);
          setAllergens(p.allergens || []);
          setCalorieLimit(p.calorieLimit || "");
        } else if (res.status === 401) {
          setError("Your session has expired. Please log in again.");
          setTimeout(() => router.push("/login"), 2000);
        } else setError("Failed to load user data. Please try again later.");
      } catch {
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
    const clickOutside = (e) => settingsOpen && !e.target.closest(".settings-dropdown") && setSettingsOpen(false);
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [settingsOpen, router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/meal-plan", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const today = data.plan?.find((d) => d.day === dayCode);
        if (!today) return;
        setTodayMeals(today.meals || []);
        const t = today.meals.reduce(
          (a, m) => ({
            calories: a.calories + num(m.macros.calories),
            protein: a.protein + num(m.macros.protein),
            carbs: a.carbs + num(m.macros.carbs),
            fat: a.fat + num(m.macros.fat),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setTotals(t);
      } catch {}
    })();
  }, []);

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setSelectedImage(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const toBase64 = (f) =>
    new Promise((r, j) => {
      const rd = new FileReader();
      rd.readAsDataURL(f);
      rd.onload = () => r(rd.result);
      rd.onerror = (e) => j(e);
    });

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
      const img = await toBase64(selectedImage);
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, date: new Date().toISOString(), image: img }),
        credentials: "include",
      });
      if (res.ok) {
        setUploadStatus("Image uploaded successfully!");
        setSelectedImage(null);
        setPreviewUrl("");
        router.push("/upload-fridge");
      } else {
        const e = await res.json();
        setUploadStatus(e.message || "Failed to upload image");
      }
    } catch {
      setUploadStatus("An unexpected error occurred");
    }
  };

  const handleLogout = () => {
    document.cookie = "access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("access-token");
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  const toggleSettings = () => setSettingsOpen(!settingsOpen);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl text-red-400 mb-4">{error}</div>
        <button onClick={() => router.push("/login")} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded">
          Go to Login
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
            <div className="relative settings-dropdown">
              <button
                onClick={toggleSettings}
                className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Your Profile</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400">Name</p>
                  <p className="font-medium">{userName || "Not set"}</p>
                </div>
                <div>
                  <p className="text-gray-400">Dietary Restrictions</p>
                  {dietaryRestrictions.length ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dietaryRestrictions.map((r, i) => (
                        <span key={i} className="bg-purple-500 px-2 py-1 rounded-full text-xs">
                          {r}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm">None specified</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 mb-2">Food Allergens</p>
                  {allergens.length ? (
                    <div className="flex flex-wrap gap-2">
                      {allergens.map((a, i) => (
                        <span key={i} className="bg-blue-500 px-2 py-1 rounded-full text-xs">
                          {a.replace(/-/g, " ")}
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

            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-2">Fridge Scan</h2>
              <p className="text-sm text-gray-400 mb-4">
                Upload a photo of your fridge contents to get recipe suggestions based on available ingredients.
              </p>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center relative">
                  {previewUrl ? (
                    <div className="relative h-48 w-full">
                      <Image src={previewUrl} alt="Fridge contents preview" fill className="object-cover rounded-lg" />
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
                  <input id="fridge-image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {dayCode === "Sun" || dayCode === "Sat" ? "This Weekend's Meal Plan" : "Today's Meal Plan"}
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => router.push("/meal-planner")} className="p-1 bg-blue-500 rounded-full hover:bg-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <Link href="/meal-planner" className="text-blue-400 hover:underline text-sm">
                    Plan Meals →
                  </Link>
                </div>
              </div>

              {todayMeals.length ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {todayMeals.map((m, i) => (
                    <div key={m.id} className="bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-300">Meal {i + 1}</h3>
                      <p className="mt-2">{m.title}</p>
                      <p className="text-sm text-gray-400">{m.macros.calories} calories</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">
                  No meal plan saved for today yet.{" "}
                  <Link href="/meal-planner" className="text-blue-400 underline">
                    Create one here
                  </Link>
                  .
                </p>
              )}

              {todayMeals.length > 0 && (
                <div className="mt-4 p-3 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-500 text-sm">
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium">Daily Summary</p>
                      <p className="text-gray-300">
                        Total Calories: {totals.calories} / {calorieLimit || "2000"}
                      </p>
                      <p className="text-gray-300">
                        P {totals.protein}g · C {totals.carbs}g · F {totals.fat}g
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
  );
}

export default HomePage;
