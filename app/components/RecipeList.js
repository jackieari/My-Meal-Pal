"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export default function RecipeList({ recipes = [], availableIngredients = [] }) {
  const [likedRecipes, setLikedRecipes] = useState({});
  const [expandedIngredients, setExpandedIngredients] = useState({});
  const [processedRecipes, setProcessedRecipes] = useState([]);

  useEffect(() => {
    // Filter out recipes with zero matching ingredients
    const filteredRecipes = recipes.filter(recipe => {
      const ingredients = recipe.extendedIngredients ||
          recipe.ingredients ||
          recipe.usedIngredients?.concat(recipe.missedIngredients) || [];

      // Check if the recipe has any matching ingredients
      const { have } = compareIngredients(ingredients);
      return have.length > 0; // Only keep recipes with at least one matching ingredient
    });

    // Sort recipes by the number of matching ingredients (most matches first)
    const sortedRecipes = [...filteredRecipes].sort((a, b) => {
      const aIngredients = a.extendedIngredients ||
          a.ingredients ||
          a.usedIngredients?.concat(a.missedIngredients) || [];

      const bIngredients = b.extendedIngredients ||
          b.ingredients ||
          b.usedIngredients?.concat(b.missedIngredients) || [];

      const aResult = compareIngredients(aIngredients);
      const bResult = compareIngredients(bIngredients);

      // Calculate scores that balance matches and missing ingredients
      // NEW CODE: Calculate recipe scores based on matches and missing ingredients
      const aTotal = aResult.have.length + aResult.need.length;
      const bTotal = bResult.have.length + bResult.need.length;

      // Avoid division by zero
      const aScore = aTotal === 0 ? 0 : (aResult.have.length / aTotal) - (aResult.need.length / aTotal * 0.5);
      const bScore = bTotal === 0 ? 0 : (bResult.have.length / bTotal) - (bResult.need.length / bTotal * 0.5);

      // NEW CODE: Primary sort by composite score
      if (bScore !== aScore) {
        return bScore - aScore; // Higher scores first
      }

      // NEW CODE: If scores are tied, use matches as tiebreaker
      if (bResult.have.length !== aResult.have.length) {
        return bResult.have.length - aResult.have.length;
      }

      // NEW CODE: If matches are tied, use fewer missing ingredients as tiebreaker
      return aResult.need.length - bResult.need.length;
    });

    setProcessedRecipes(sortedRecipes);
  }, [recipes, availableIngredients]);

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

  const compareIngredients = (recipeIngredients) => {
    if (!recipeIngredients || !Array.isArray(recipeIngredients)) {
      return { have: [], need: [] };
    }

    const lowercaseAvailable = availableIngredients.map(ing => ing.toLowerCase());

    const have = [];
    const need = [];

    recipeIngredients.forEach(ingredient => {
      const ingredientName = ingredient.name || ingredient;

      const found = lowercaseAvailable.some(avail =>
          ingredientName.toLowerCase().includes(avail) ||
          avail.includes(ingredientName.toLowerCase())
      );

      if (found) {
        have.push(ingredientName);
      } else {
        need.push(ingredientName);
      }
    });

    return { have, need };
  };

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

  const toggleExpandIngredients = (recipeId, type) => {
    setExpandedIngredients(prev => ({
      ...prev,
      [`${recipeId}-${type}`]: !prev[`${recipeId}-${type}`]
    }));
  };

  if (processedRecipes.length === 0 && recipes.length > 0) {
    return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 font-medium mb-2">No recipes with matching ingredients</p>
          <p className="text-sm text-yellow-600">
            None of your ingredients matched any recipes. Try adding more ingredients or adjusting your filters.
          </p>
        </div>
    );
  }

  return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {processedRecipes.map((recipe) => {
          const recipeId = recipe.recipeId || recipe.id;
          const { have, need } = compareIngredients(
              recipe.extendedIngredients || recipe.ingredients ||
              recipe.usedIngredients?.concat(recipe.missedIngredients) || []
          );

          const haveExpanded = expandedIngredients[`${recipeId}-have`];
          const needExpanded = expandedIngredients[`${recipeId}-need`];

        return (
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

                {availableIngredients.length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-1">
                          Ingredients You Have ({have.length})
                        </h4>

                        {have.length > 0 ? (
                            <div className="text-sm text-gray-600">
                              {haveExpanded ? (
                                  <div>
                                    <ul className="list-disc pl-5 mb-1">
                                      {have.map((ingredient, index) => (
                                          <li key={index} className="mb-0.5">{ingredient}</li>
                                      ))}
                                    </ul>
                                    {/* Only show "Show less" button if there are more than 3 ingredients */}
                                    {have.length > 3 && (
                                        <button
                                            onClick={() => toggleExpandIngredients(recipeId, 'have')}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center mt-1"
                                        >
                                          Show less <ChevronUp className="h-3 w-3 ml-1" />
                                        </button>
                                    )}
                                  </div>
                              ) : (
                                  /* Collapsed view showing only first 3 ingredients */
                                  <div>
                                    {have.slice(0, 3).join(", ")}
                                    {/* Only show "+X more" button if there are more than 3 ingredients */}
                                    {have.length > 3 && (
                                        <button
                                            onClick={() => toggleExpandIngredients(recipeId, 'have')}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center ml-1"
                                        >
                                          +{have.length - 3} more <ChevronDown className="h-3 w-3 ml-1" />
                                        </button>
                                    )}
                                  </div>
                              )}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 italic">None of your ingredients match this recipe</div>
                        )}
                      </div>

                      {/* Ingredients you need */}
                      <div>
                        <h4 className="text-sm font-medium text-amber-700 mb-1">
                          Ingredients You Need ({need.length})
                        </h4>

                        {need.length > 0 ? (
                            <div className="text-sm text-gray-600">
                              {needExpanded ? (
                                  <div>
                                    <ul className="list-disc pl-5 mb-1">
                                      {need.map((ingredient, index) => (
                                          <li key={index} className="mb-0.5">{ingredient}</li>
                                      ))}
                                    </ul>
                                    {/* Only show "Show less" button if there are more than 3 ingredients */}
                                    {need.length > 3 && (
                                        <button
                                            onClick={() => toggleExpandIngredients(recipeId, 'need')}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center mt-1"
                                        >
                                          Show less ▲
                                        </button>
                                    )}
                                  </div>
                              ) : (
                                  /* Collapsed view showing only first 3 ingredients */
                                  <div>
                                    {need.slice(0, 3).join(", ")}
                                    {/* Only show "+X more" button if there are more than 3 ingredients */}
                                    {need.length > 3 && (
                                        <button
                                            onClick={() => toggleExpandIngredients(recipeId, 'need')}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center ml-1"
                                        >
                                          +{need.length - 3} more ▼
                                        </button>
                                    )}
                                  </div>
                              )}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 italic">You have all needed ingredients!</div>
                        )}
                      </div>
                    </div>
                )}
              </div>
            </div>
        );
        })}
      </div>
  );
}