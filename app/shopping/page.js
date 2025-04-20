"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ShoppingListPage() {
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [userIngredients, setUserIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [finalIngredients, setFinalIngredients] = useState([]);
  const [groceryProducts, setGroceryProducts] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  const spoonacularApiKey = "6f3e35ad7c004cc28796a5e46e86931f";

  useEffect(() => {
    const stored = localStorage.getItem("detectedIngredients");
    if (stored) setUserIngredients(JSON.parse(stored));
  }, []);

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

  useEffect(() => {
    if (!selectedRecipeId) return;

    (async () => {
      try {
        const res = await fetch(
          `https://api.spoonacular.com/recipes/${selectedRecipeId}/ingredientWidget.json?apiKey=${spoonacularApiKey}`
        );
        const data = await res.json();
        const ingredientNames = data.ingredients?.map((i) => i.name) || [];
        setRecipeIngredients((prev) => [...new Set([...prev, ...ingredientNames])]);
      } catch (err) {
        console.error("Failed to fetch ingredients for recipe:", selectedRecipeId, err);
      }
    })();
  }, [selectedRecipeId]);

  const handleAddIngredient = () => {
    if (newIngredient && !recipeIngredients.includes(newIngredient)) {
      setRecipeIngredients((prev) => [...new Set([...prev, newIngredient])]);
      setNewIngredient("");
    }
  };

  const handleDeleteIngredient = (ingredientToDelete) => {
    setRecipeIngredients((prev) =>
      prev.filter((ingredient) => ingredient !== ingredientToDelete)
    );
  };

  const handleSubmit = () => {
    const filtered = recipeIngredients.filter((ing) => !userIngredients.includes(ing));
    setFinalIngredients(filtered);
  };

  useEffect(() => {
    if (finalIngredients.length === 0) return;

    const fetchProductData = async () => {
      const productData = [];

      for (const ingredient of finalIngredients) {
        try {
          const res = await fetch(
            `https://api.spoonacular.com/food/products/search?query=${ingredient}&number=1&addProductInformation=true&apiKey=${spoonacularApiKey}`
          );
          const data = await res.json();
          const product = data.products?.[0];

          if (product) {
            productData.push({
              name: product.title,
              price: product.price || 0,
              description: product.description || "No description available",
              brand: product.brand || "No brand info",
              details: product.productInformation || [],
              badges: product.importantBadges || [],
            });
          }
        } catch (err) {
          console.error("Failed to fetch product for ingredient:", ingredient, err);
        }
      }

      setGroceryProducts(productData);
      setTotalCost(productData.reduce((sum, p) => sum + p.price, 0));
    };

    fetchProductData();
  }, [finalIngredients]);

  const uniqueUserIngredients = [...new Set(userIngredients)];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Shopping List</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* User Ingredients */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Your Ingredients</h2>
          <div className="flex flex-wrap gap-2">
            {uniqueUserIngredients.length > 0 ? (
              uniqueUserIngredients.map((ingredient, i) => (
                <div key={i} className="bg-white px-4 py-2 rounded shadow text-sm">
                  {ingredient}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No ingredients detected.</p>
            )}
          </div>
        </section>

        {/* Add Ingredient */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Add Ingredient</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              placeholder="Enter ingredient"
              className="flex-grow px-4 py-2 border border-gray-300 rounded focus:ring-blue-500"
            />
            <button
              onClick={handleAddIngredient}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </section>

        {/* Liked Recipes */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Your Liked Recipes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedRecipes.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRecipeId(r.id)}
                className={`cursor-pointer bg-white p-4 rounded shadow hover:shadow-md transition ${
                  selectedRecipeId === r.id ? "ring-2 ring-blue-400" : ""
                }`}
              >
                <img
                  src={r.image ?? `https://spoonacular.com/recipeImages/${r.id}-556x370.jpg`}
                  alt={r.title}
                  className="w-full h-40 object-cover rounded mb-2"
                />
                <h3 className="text-lg font-medium">{r.title}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Recipe Ingredients */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Recipe Ingredients</h2>
          <div className="flex flex-wrap gap-2">
            {recipeIngredients.length > 0 ? (
              recipeIngredients.map((ingredient, i) => (
                <div
                  key={i}
                  className="bg-white px-4 py-2 rounded shadow text-sm flex items-center gap-2"
                >
                  {ingredient}
                  <button
                    onClick={() => handleDeleteIngredient(ingredient)}
                    className="text-red-500 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No ingredients yet.</p>
            )}
          </div>
        </section>

        <div className="text-center">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Submit
          </button>
        </div>

        {/* Products */}
        {groceryProducts.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Grocery Products</h2>
            <div className="space-y-6">
              {groceryProducts.map((product, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow space-y-3">
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <ul className="list-disc text-sm text-gray-600 pl-5">
                    {product.details.length > 0 ? (
                      product.details.map((detail, idx) => <li key={idx}>{detail}</li>)
                    ) : (
                      <li>No product information.</li>
                    )}
                  </ul>
                  {product.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                        >
                          {badge.replace("_", " ").toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>${product.price.toFixed(2)}</span>
                    <span>{product.brand}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right font-semibold text-lg">
              Total: ${totalCost.toFixed(2)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}