"use client";

import { useEffect, useState } from "react";
import RecipeList from "../components/RecipeList";
import IngredientsList from "../components/IngredientsList";

const CUISINES = [
  "All", "African", "American", "British", "Cajun", "Caribbean", "Chinese", "Eastern European",
  "European", "French", "German", "Greek", "Indian", "Irish", "Italian", "Japanese",
  "Jewish", "Korean", "Latin American", "Mediterranean", "Mexican", "Middle Eastern",
  "Nordic", "Southern", "Spanish", "Thai", "Vietnamese"
];

export default function ResultsClient() {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [cuisine, setCuisine] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [maxReadyTime, setMaxReadyTime] = useState("");
  const [minServings, setMinServings] = useState("");
  const [maxCarbs, setMaxCarbs] = useState("");
  const [maxCalories, setMaxCalories] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [allergens, setAllergens] = useState([]);

  useEffect(() => {
    const storedIngredients = localStorage.getItem("detectedIngredients");
    const storedCuisine = localStorage.getItem("selectedCuisine");

    if (storedIngredients) {
      setIngredients(JSON.parse(storedIngredients));
    }

    if (storedCuisine) {
      setCuisine(storedCuisine);
    }

    const fetchUserInfo = async () => {
      let token = null;
      const cookies = document.cookie.split(";").map(c => c.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith("access-token=")) {
          token = cookie.substring("access-token=".length);
          break;
        } else if (cookie.startsWith("token=")) {
          token = cookie.substring("token=".length);
          break;
        } else if (cookie.startsWith("next-auth.session-token=")) {
          token = cookie.substring("next-auth.session-token=".length);
          break;
        } else if (cookie.startsWith("session=")) {
          token = cookie.substring("session=".length);
          break;
        }
      }

      if (!token) {
        token = localStorage.getItem("token") || localStorage.getItem("access-token");
      }

      if (!token) return;

      try {
        const res = await fetch("/api/users/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.user?.email || "");
          const prefs = data.user?.nutritionalPreferences || {};
          setDietaryRestrictions(prefs.dietaryRestrictions || []);
          setAllergens(prefs.allergens || []);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    fetchUserInfo();
  }, []);

  const handleSubmit = async () => {
    if (ingredients.length === 0) {
      setError("Please add at least one ingredient");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update cuisine handling for 'All' to be empty string
      const selectedCuisine = cuisine === "All" ? "" : cuisine;

      // Store the selected cuisine in localStorage
      localStorage.setItem("selectedCuisine", cuisine);

      // Create the request body with all filters
      const requestBody = {
        ingredients: ingredients,
        cuisine: selectedCuisine,
        maxReadyTime: maxReadyTime ? Number(maxReadyTime) : undefined,
        minServings: minServings ? Number(minServings) : undefined,
        maxCarbs: maxCarbs ? Number(maxCarbs) : undefined,
        maxCalories: maxCalories ? Number(maxCalories) : undefined,
        dietaryRestrictions,
        allergens,
      };

      console.log("Sending request to Spoonacular API:", requestBody);

      // Send the POST request to the API
      const res = await fetch("/api/spoonacular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("Spoonacular API response:", data);

      // Handle the response data
      if (data.success) {
        setRecipes(data.recipes || []);
        if (data.recipes?.length === 0) {
          setError("No recipes found matching your criteria. Try adjusting your filters or adding more ingredients.");
        }
      } else {
        setError(data.error || "Failed to fetch recipes");
        setRecipes([]);
      }
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setError("An unexpected error occurred. Please try again.");
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="space-y-12 p-4">
        {/* User Preferences */}
        <section>
          <h3 className="text-2xl font-semibold mb-4">Your Preferences</h3>

          {userEmail && (
              <p className="text-sm text-gray-700 mb-4">
                Email: <span className="font-medium">{userEmail}</span>
              </p>
          )}

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-800 mb-1">Dietary Restrictions:</p>
            {dietaryRestrictions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dietaryRestrictions.map((item, index) => (
                      <span
                          key={index}
                          className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full border border-purple-300"
                      >
                  {item}
                </span>
                  ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500">None specified</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-800 mb-1">Allergens:</p>
            {allergens.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergens.map((item, index) => (
                      <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-300"
                      >
                  {item.replace(/-/g, " ")}
                </span>
                  ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500">None specified</p>
            )}
          </div>
        </section>

        {/* Detected Ingredients */}
        <section>
          <h3 className="text-2xl font-semibold mb-4">Your Ingredients</h3>
          <IngredientsList ingredients={ingredients} />
        </section>

        {/* Filters */}
        <section>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label className="text-lg font-medium">Choose a cuisine:</label>
              <select
                  className="border border-gray-300 rounded px-3 py-2"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
              >
                {CUISINES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium">Max Ready Time (min)</label>
                <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={maxReadyTime}
                    onChange={(e) => setMaxReadyTime(e.target.value)}
                    placeholder="e.g. 20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Min Servings</label>
                <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={minServings}
                    onChange={(e) => setMinServings(e.target.value)}
                    placeholder="e.g. 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Max Carbs (g)</label>
                <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={maxCarbs}
                    onChange={(e) => setMaxCarbs(e.target.value)}
                    placeholder="e.g. 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Max Calories</label>
                <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={maxCalories}
                    onChange={(e) => setMaxCalories(e.target.value)}
                    placeholder="e.g. 800"
                />
              </div>
            </div>

            <button
                className={`px-4 py-2 rounded transition self-start ${
                    isLoading
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                onClick={handleSubmit}
                disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Submit"}
            </button>
          </div>
        </section>

        {/* Error message */}
        {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
        )}

        {/* Recipe Results */}
        <section>
          <h3 className="text-2xl font-semibold mb-4">Recipes You Can Make</h3>
          {recipes.length > 0 ? (
              <RecipeList
                  recipes={recipes}
                  availableIngredients={ingredients}
              />
          ) : !isLoading && !error ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700 font-medium mb-2">No recipes found yet</p>
                <p className="text-sm text-yellow-600">
                  Use the filters above and click "Submit" to search for recipes based on your ingredients and preferences.
                </p>
              </div>
          ) : null}
        </section>
      </div>
  );
}