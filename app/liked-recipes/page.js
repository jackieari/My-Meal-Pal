"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export default function RecipeList({ recipes = [] }) {
  const [likedRecipes, setLikedRecipes] = useState({});  // State for liked recipes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch liked recipes from the backend on page load
    const fetchLikedRecipes = async () => {
      try {
        setLoading(true); // Set loading state to true
        const response = await fetch("/api/likes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch liked recipes");
        }

        const data = await response.json();

        // Check if we received liked recipes and update the state
        if (data.recipes) {
          const likedRecipesMap = {};
          data.recipes.forEach((recipeId) => {
            likedRecipesMap[recipeId] = true;  // Mark recipe as liked in state
          });
          setLikedRecipes(likedRecipesMap);
        } else {
          console.error("No recipes found in the response");
          setLikedRecipes({});
        }
      } catch (error) {
        console.error("Error fetching liked recipes:", error);
        setError("Failed to load liked recipes");
      } finally {
        setLoading(false); // Set loading state to false
      }
    };

    fetchLikedRecipes();
  }, []);  // Empty dependency array to run on component mount

  const toggleLike = async (recipeId) => {
    console.log("Clicked Like for Recipe ID:", recipeId);  // Debugging line
    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId }), // Send the recipeId to backend
      });

      const data = await response.json();

      // If the like/unlike action was successful, update the state
      if (data.message === "Recipe liked successfully" || data.message === "Recipe unliked successfully") {
        setLikedRecipes((prev) => ({
          ...prev,
          [recipeId]: !prev[recipeId],  // Toggle like state
        }));
      } else {
        console.error("Error toggling like status:", data.error);
      }
    } catch (error) {
      console.error("Error liking/unliking recipe:", error);
    }
  };

  // Display loading screen if data is still being fetched
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl">Loading recipes...</p>
      </div>
    );
  }

  // Display error message if something goes wrong while fetching data
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <div key={recipe.recipeId} className="bg-white text-black rounded-lg shadow-md overflow-hidden">
          <Link href={recipe.url || "#"} passHref>
            <div className="relative w-full h-48 cursor-pointer">
              <Image
                src={recipe.image || "/placeholder.svg"}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            </div>
          </Link>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{recipe.title}</h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleLike(recipe.recipeId);  // Use recipeId here to toggle like/unlike
                }}
                className="flex items-center justify-center p-2 transition-colors"
                aria-label={likedRecipes[recipe.recipeId] ? "Unlike recipe" : "Like recipe"}
              >
                <Heart
                  className={`w-5 h-5 ${
                    likedRecipes[recipe.recipeId] ? "fill-rose-500 text-rose-500" : "text-gray-400 hover:text-rose-500"
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              {recipe.usedIngredientCount} used / {recipe.missedIngredientCount} missing
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
