"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShoppingListPage() {
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [userIngredients, setUserIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState(""); // For adding ingredients
  const [finalIngredients, setFinalIngredients] = useState([]); // Store final ingredient list
  const [groceryProducts, setGroceryProducts] = useState([]); // Store results from Spoonacular API
  const [totalCost, setTotalCost] = useState(0); // Total cost of products

  const spoonacularApiKey = "b348b9e5a277b82e6c23f4850f6a5a8705e32bec"; 

  // Load ingredients from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("detectedIngredients");
    if (stored) setUserIngredients(JSON.parse(stored));
  }, []);

  // Load liked recipes
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/liked-recipes");
        const data = await res.json();
        if (data.success) setLikedRecipes(data.recipes);
      } catch (err) {
        console.error("Failed to fetch liked recipes", err);
      }
    })();
  }, []);

  // Fetch recipe ingredients when a recipe is selected
  useEffect(() => {
    if (!selectedRecipeId) return;

    (async () => {
      try {
        const res = await fetch(
          `https://api.spoonacular.com/recipes/${selectedRecipeId}/ingredientWidget.json?apiKey=6f3e35ad7c004cc28796a5e46e86931f`
        );
        const data = await res.json();
        console.log("Fetched recipe ingredients:", data);

        if (data.ingredients) {
          const ingredientNames = data.ingredients.map((ingredient) => ingredient.name);
          setRecipeIngredients((prevIngredients) => [
            ...new Set([...prevIngredients, ...ingredientNames]),
          ]);
        } else {
          setRecipeIngredients([]);
        }
      } catch (err) {
        console.error("Failed to fetch ingredients for recipe:", selectedRecipeId, err);
      }
    })();
  }, [selectedRecipeId]);

  // Handle adding new ingredient
  const handleAddIngredient = () => {
    if (newIngredient && !recipeIngredients.includes(newIngredient)) {
      setRecipeIngredients((prevIngredients) => [
        ...new Set([...prevIngredients, newIngredient]),
      ]);
      setNewIngredient(""); // Clear input after adding
    }
  };

  // Handle deleting an ingredient
  const handleDeleteIngredient = (ingredientToDelete) => {
    setRecipeIngredients((prevIngredients) =>
      prevIngredients.filter((ingredient) => ingredient !== ingredientToDelete)
    );
  };

  // Handle submit button to remove user ingredients from the final list
  const handleSubmit = () => {
    // Remove any user ingredients from the recipe ingredients
    const filteredIngredients = recipeIngredients.filter(
      (ingredient) => !userIngredients.includes(ingredient)
    );
    setFinalIngredients(filteredIngredients); // Update the final ingredients list
  };

  // Fetch grocery product data for final ingredients
  useEffect(() => {
    if (finalIngredients.length === 0) return;

    console.log("Fetching grocery product data for ingredients:", finalIngredients);  // Log for debugging

    const fetchProductData = async () => {
      const productData = [];

      for (const ingredient of finalIngredients) {
        try {
          const res = await fetch(
            `https://api.spoonacular.com/food/products/search?query=${ingredient}&number=1&addProductInformation=true&apiKey=${spoonacularApiKey}`
          );
          const data = await res.json();
          console.log("Fetched product data:", data);  // Log the fetched data

          if (data.products && data.products.length > 0) {
            const product = data.products[0];
            
            // Extract important badges
            const badges = product.importantBadges || [];  // If no badges, use an empty array

            productData.push({
              name: product.title,
              price: product.price || 0,
              description: product.description || "No description available",
              brand: product.brand || "No brand information",
              details: product.productInformation || [],
              badges: badges,  // Add badges to the product data
            });
          }
        } catch (err) {
          console.error("Failed to fetch product for ingredient:", ingredient, err);
        }
      }

      setGroceryProducts(productData);
      console.log("Updated grocery products:", productData);  // Log updated products list

      const total = productData.reduce((sum, product) => sum + product.price, 0);
      setTotalCost(total);
      console.log("Total cost:", total);  // Log the total cost
    };

    fetchProductData();
  }, [finalIngredients]);

  // Remove duplicates from the user ingredients
  const uniqueUserIngredients = [...new Set(userIngredients)];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Shopping List</h1>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-6">
        {/* User's ingredients */}
        <div className="mb-8">
          <h2 className="text-3xl font-semibold mb-4">Your Ingredients</h2>
          <div className="flex overflow-x-auto space-x-4">
            {uniqueUserIngredients.length > 0 ? (
              uniqueUserIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-md px-4 py-2 text-white flex items-center justify-between"
                >
                  <span>{ingredient}</span>
                </div>
              ))
            ) : (
              <p className="text-lg text-gray-400">No ingredients detected.</p>
            )}
          </div>
        </div>

        {/* Add ingredient input */}
        <div className="mb-8">
          <h2 className="text-3xl font-semibold mb-4">Add Ingredient</h2>
          <input
            type="text"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            className="bg-gray-800 rounded-md px-4 py-2 text-white w-full"
            placeholder="Enter ingredient"
          />
          <button
            onClick={handleAddIngredient}
            className="bg-blue-500 text-white px-6 py-3 rounded-md mt-4"
          >
            Add Ingredient
          </button>
        </div>

        {/* Liked Recipes */}
        <div className="mb-8">
          <h2 className="text-3xl font-semibold mb-4">Your Liked Recipes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedRecipes.map((r) => (
              <div
                key={r.id}
                className={`border rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition ${
                  selectedRecipeId === r.id ? "border-blue-500 ring-2 ring-blue-300" : ""
                }`}
                onClick={() => setSelectedRecipeId(r.id)}
              >
                <img
                  src={r.image ?? `https://spoonacular.com/recipeImages/${r.id}-556x370.jpg`}
                  alt={r.title}
                  className="w-full h-40 object-cover mb-2 rounded"
                />
                <h3 className="text-lg font-medium">{r.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients for selected recipe */}
        <div>
          <h2 className="text-3xl font-semibold mb-4">Ingredients for Selected Recipes</h2>
          <div className="flex overflow-x-auto space-x-4">
            {recipeIngredients.length > 0 ? (
              recipeIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-md px-4 py-2 text-white flex items-center justify-between"
                >
                  <span>{ingredient}</span>
                  <button
                    className="text-red-500 ml-2"
                    onClick={() => handleDeleteIngredient(ingredient)}
                  >
                    X
                  </button>
                </div>
              ))
            ) : (
              <p className="text-lg text-gray-400">Loading ingredients…</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white px-6 py-3 rounded-md"
          >
            Submit
          </button>
        </div>

        {/* Display Grocery Products and Total Cost */}
        {groceryProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-3xl font-semibold mb-4">Grocery Products</h2>
            <div className="space-y-6">
              {groceryProducts.map((product, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-xl p-6 shadow-md space-y-4"
                >
                  <h3 className="text-lg font-medium">{product.name}</h3>

                  <ul className="text-sm text-gray-400 list-disc pl-5">
                    {product.details.length > 0 ? (
                      product.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))
                    ) : (
                      <li>No additional product information.</li>
                    )}
                  </ul>

                  {/* Render badges */}
                  {product.badges.length > 0 && (
                    <div className="mt-2 flex space-x-3">
                      {product.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded"
                        >
                          {badge.replace("_", " ").toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <p className="text-lg">${product.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-400">{product.brand}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-lg font-semibold">
              Total Cost: ${totalCost.toFixed(2)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}