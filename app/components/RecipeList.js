"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export default function RecipeList({ recipes = [] }) {
  const [likedRecipes, setLikedRecipes] = useState({});

  useEffect(() => {
    const fetchLikedRecipes = async () => {
      try {
        const response = await fetch("/api/likes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();

        if (data.recipes) {
          const likedRecipesMap = {};
          data.recipes.forEach((recipeId) => {
            likedRecipesMap[recipeId] = true;
          });
          setLikedRecipes(likedRecipesMap);
        }
      } catch (error) {
        console.error("Error fetching liked recipes:", error);
      }
    };

    fetchLikedRecipes();
  }, []);

  console.log("Recipes data:", recipes);
  if (recipes.length > 0) {
    console.log("First recipe details:", {
      title: recipes[0].title,
      usedIngredients: recipes[0].usedIngredients,
      missedIngredients: recipes[0].missedIngredients,
    });
  }

  const toggleLike = async (recipeId) => {
    if (!recipeId) {
      console.error("No recipeId provided.");
      return;
    }

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId }),
      });

      const data = await response.json();

      if (data.message === "Recipe liked successfully" || data.message === "Recipe unliked successfully") {
        setLikedRecipes((prev) => ({
          ...prev,
          [recipeId]: !prev[recipeId], // Toggle the like state
        }));
      } else {
        console.error("Error toggling like status:", data.error);
      }
    } catch (error) {
      console.error("Error liking/unliking recipe:", error);
    }
  };

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
                        toggleLike(recipe.recipeId);
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

                {/* Display Calories */}
                {recipe.calories && (
                    <p className="text-sm text-green-700 mt-3 pt-2 border-t border-gray-100">
                      <strong>Calories:</strong> {recipe.calories}
                    </p>
                )}

                {/* Display Basic Nutrition Info */}
                {recipe.nutrition && recipe.nutrition.length > 0 && (
                    <div className="mt-2 text-sm text-gray-700">
                      <p className="font-medium mb-1">Nutrition:</p>
                      <div className="flex flex-wrap gap-x-4">
                        {recipe.nutrition
                            .filter((n) => ["Fat", "Carbohydrates", "Protein"].includes(n.name))
                            .map((nutrient) => (
                                <span key={nutrient.name}>
                        {nutrient.name}: {nutrient.amount}
                                  {nutrient.unit}
                      </span>
                            ))}
                      </div>
                    </div>
                )}
              </div>
            </div>
        ))}
      </div>
  );
}