"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { calculateCalories } from "@/lib/calorie-calculator"

export default function ProfilePage() {
  const [userName, setUserName] = useState("")
  const [dietaryRestrictions, setDietaryRestrictions] = useState([])
  const [calorieLimit, setCalorieLimit] = useState("")
  const [allergens, setAllergens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCalorieCalculator, setShowCalorieCalculator] = useState(false)

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

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        console.log("Fetching user info...");
        
        // Check for the access token in cookies
        const cookies = document.cookie.split(';');
        let accessToken = null;
        
        // Log all cookies for debugging
        console.log("Available cookies on client:", cookies);
        
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'access-token') {
            accessToken = value;
            console.log("Found access-token cookie in client:", accessToken.substring(0, 10) + "...");
            break;
          }
        }
        
        if (!accessToken) {
          console.warn("No access-token cookie found on client");
        }
        
        const response = await fetch("/api/users/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
          },
          credentials: "include" // Send cookies automatically
        });

        console.log("User info response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("User data received");
          
          setUserName(data.user.name || "");

          // Set dietary restrictions as array
          const restrictions = data.user.nutritionalPreferences?.dietaryRestrictions || [];
          setDietaryRestrictions(restrictions);

          // Set calorie limit
          setCalorieLimit(data.user.nutritionalPreferences?.calorieLimit || "");

          // Set allergens as array
          const userAllergens = data.user.nutritionalPreferences?.allergens || [];
          setAllergens(userAllergens);

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
            });
          }
        } else {
          let errorMessage = "Failed to fetch user data";
          try {
            const errorData = await response.json();
            console.error("Failed to fetch user data:", errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            console.error("Error parsing error response:", jsonError);
          }
          setError(errorMessage);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("An error occurred while fetching your data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Submitting profile update...");
      
      // Check for the access token in cookies
      const cookies = document.cookie.split(';');
      let accessToken = null;
      
      // Log all cookies for debugging
      console.log("Available cookies on submit:", cookies);
      
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access-token') {
          accessToken = value;
          console.log("Found access-token cookie:", accessToken.substring(0, 10) + "...");
          break;
        }
      }
      
      if (!accessToken) {
        console.error("No access-token cookie found");
        setError("Authentication token not found. Please log in again.");
        return;
      }
      
      // Prepare the payload
      const payload = {
        dietaryRestrictions,
        calorieLimit: calorieLimit ? Number(calorieLimit) : null,
        allergens,
      };
      
      if (showCalorieCalculator && bodyMetrics) {
        payload.bodyMetrics = bodyMetrics;
      }
      
      console.log("Request payload:", payload);

      // Include both cookie and header authentication for maximum compatibility
      const response = await fetch("/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}` // Also send as header
        },
        credentials: "include", // Send cookies
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        let errorMessage = "Failed to update profile";
        try {
          const errorData = await response.json();
          console.error("Update failed:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error during update:", err);
      setError("An unexpected error occurred");
    }
  };

  const handleBodyMetricsChange = (field, value) => {
    setBodyMetrics((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateNewCalories = () => {
    const calorieData = calculateCalories({
      ...bodyMetrics,
      allergens,
      dietaryRestrictions,
    });
    setCalculatedCalories(calorieData);
    setCalorieLimit(calorieData.dailyCalories);
  };

  // Handle allergen selection
  const handleAllergenToggle = (allergen) => {
    setAllergens((prev) => {
      if (prev.includes(allergen)) {
        return prev.filter((a) => a !== allergen);
      } else {
        return [...prev, allergen];
      }
    });
  };

  // Handle dietary restriction selection
  const handleDietaryToggle = (restriction) => {
    setDietaryRestrictions((prev) => {
      if (prev.includes(restriction)) {
        return prev.filter((r) => r !== restriction);
      } else {
        return [...prev, restriction];
      }
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">Loading...</div>;
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
  ];

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
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome, {userName}</h1>
      <p className="text-lg mb-6">Manage your profile and nutrition settings</p>

      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-gray-700 pb-2">Nutritional Preferences</h2>

            {/* Calorie Limit */}
            <div>
              <label htmlFor="calorieLimit" className="block mb-2">
                Daily Calorie Target
              </label>
              <input
                type="number"
                id="calorieLimit"
                value={calorieLimit}
                onChange={(e) => setCalorieLimit(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block mb-2">Dietary Restrictions</label>
              <div className="grid grid-cols-2 gap-2">
                {dietaryOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`diet-${option.id}`}
                      checked={dietaryRestrictions.includes(option.id)}
                      onChange={() => handleDietaryToggle(option.id)}
                      className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor={`diet-${option.id}`} className="text-sm">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div>
              <label className="block mb-2">Food Allergens</label>
              <div className="grid grid-cols-2 gap-2">
                {allergenOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`allergen-${option.id}`}
                      checked={allergens.includes(option.id)}
                      onChange={() => handleAllergenToggle(option.id)}
                      className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor={`allergen-${option.id}`} className="text-sm">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Food Allergens Display */}
            <div>
              <p className="text-gray-400 mb-2">Selected Allergens</p>
              {allergens && allergens.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergens.map((allergen, index) => (
                    <span key={index} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {allergen.replace(/-/g, " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm">None specified</p>
              )}
            </div>
          </div>

          {/* Calorie Calculator Toggle */}
          <div className="pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowCalorieCalculator(!showCalorieCalculator)}
              className="text-blue-400 hover:text-blue-300 flex items-center"
            >
              {showCalorieCalculator ? "− Hide Calorie Calculator" : "+ Recalculate My Calories"}
            </button>
          </div>

          {/* Body Metrics for Calorie Calculation */}
          {showCalorieCalculator && (
            <div className="space-y-4 pt-2 border-t border-gray-700">
              <h2 className="text-xl font-semibold pb-2 pt-2">Body Metrics</h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={bodyMetrics.gender}
                    onChange={(e) => handleBodyMetricsChange("gender", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dob" className="block mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dob"
                    value={bodyMetrics.dob}
                    onChange={(e) => handleBodyMetricsChange("dob", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Current Weight */}
                <div>
                  <label htmlFor="currentWeight" className="block mb-2">
                    Current Weight (lbs)
                  </label>
                  <input
                    type="number"
                    id="currentWeight"
                    value={bodyMetrics.currentWeight}
                    onChange={(e) => handleBodyMetricsChange("currentWeight", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Goal Weight */}
                <div>
                  <label htmlFor="goalWeight" className="block mb-2">
                    Goal Weight (lbs)
                  </label>
                  <input
                    type="number"
                    id="goalWeight"
                    value={bodyMetrics.goalWeight}
                    onChange={(e) => handleBodyMetricsChange("goalWeight", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Height */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Height</label>
                  <div className="flex gap-2">
                    <select
                      value={bodyMetrics.heightFeet}
                      onChange={(e) => handleBodyMetricsChange("heightFeet", e.target.value)}
                      className="w-1/2 px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 4).map((feet) => (
                        <option key={feet} value={feet.toString()}>
                          {feet} ft
                        </option>
                      ))}
                    </select>
                    <select
                      value={bodyMetrics.heightInches}
                      onChange={(e) => handleBodyMetricsChange("heightInches", e.target.value)}
                      className="w-1/2 px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i).map((inches) => (
                        <option key={inches} value={inches.toString()}>
                          {inches} in
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label htmlFor="activityLevel" className="block mb-2">
                    Activity Level
                  </label>
                  <select
                    id="activityLevel"
                    value={bodyMetrics.activityLevel}
                    onChange={(e) => handleBodyMetricsChange("activityLevel", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Lightly Active</option>
                    <option value="moderate">Moderately Active</option>
                    <option value="very">Very Active</option>
                    <option value="extra">Extra Active</option>
                  </select>
                </div>
              </div>

              {/* Fitness Goal */}
              <div>
                <label htmlFor="fitnessGoal" className="block mb-2">
                  Your Fitness Goal
                </label>
                <select
                  id="fitnessGoal"
                  value={bodyMetrics.fitnessGoal}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleBodyMetricsChange("fitnessGoal", value);
                    // Reset weekly goal when changing fitness goal
                    const weeklyGoal =
                      value === "lose" ? "1" : value === "gain" ? "0.5" : value === "muscle" ? "0.25" : "0";
                    handleBodyMetricsChange("weeklyGoal", weeklyGoal);
                  }}
                  className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor="weeklyGoal" className="block mb-2">
                    Weekly Goal
                  </label>
                  <select
                    id="weeklyGoal"
                    value={bodyMetrics.weeklyGoal}
                    onChange={(e) => handleBodyMetricsChange("weeklyGoal", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full py-2 bg-green-600 rounded hover:bg-green-700 transition duration-300"
                >
                  Calculate New Calorie Target
                </button>
              </div>

              {/* Calculated Results */}
              {calculatedCalories && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Your New Calorie Target</h3>
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {calculatedCalories.dailyCalories} calories
                  </div>
                  <p className="text-sm text-gray-300">
                    Based on your metrics, we recommend {calculatedCalories.protein}g protein,{" "}
                    {calculatedCalories.carbs}g carbs, and {calculatedCalories.fat}g fat daily.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">This target will be saved when you update your profile.</p>
                </div>
              )}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 rounded hover:bg-blue-600 transition duration-300 mt-6"
          >
            Update Profile
          </button>
        </form>
      </div>

      <div className="flex gap-4 mt-2">
        <Link href="/home" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Home
        </Link>
        <Link href="/settings" className="px-4 py-2 bg-purple-400 text-white rounded hover:bg-green-600">
          ⚙️ Settings
        </Link>
      </div>
    </div>
  );
}