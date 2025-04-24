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
  const [groceryProducts, setGroceryProducts] = useState({});
  const [selectedProducts, setSelectedProducts] = useState({});
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
      const allProductData = {};

      for (const ingredient of finalIngredients) {
        try {
          const res = await fetch(
            `https://api.spoonacular.com/food/products/search?query=${ingredient}&number=5&addProductInformation=true&apiKey=${spoonacularApiKey}`
          );
          const data = await res.json();
          const products = data.products?.map((product) => ({
            name: product.title,
            price: product.price || 0,
            description: product.description || "No description available",
            brand: product.brand || "No brand info",
            details: product.productInformation || [],
            badges: product.importantBadges || [],
          })) || [];

          if (products.length > 0) {
            allProductData[ingredient] = products;
          }
        } catch (err) {
          console.error("Failed to fetch products for ingredient:", ingredient, err);
        }
      }

      setGroceryProducts(allProductData);
    };

    fetchProductData();
  }, [finalIngredients]);

  useEffect(() => {
    const total = Object.values(selectedProducts).reduce(
      (sum, product) => sum + (product?.price || 0),
      0
    );
    setTotalCost(total);
  }, [selectedProducts]);

  const handleSelectProduct = (ingredient, product) => {
    setSelectedProducts((prev) => ({ ...prev, [ingredient]: product }));
  };

  const uniqueUserIngredients = [...new Set(userIngredients)];

  return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <nav className="bg-white shadow-md p-4 sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Shopping List</h1>
          </div>
        </nav>

        <div className="container mx-auto px-4 pt-4">
          <Link
              href="/home"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-md shadow hover:bg-blue-50 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"/>
            </svg>
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>

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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Your Liked Recipes</h2>
              <p className="text-sm text-gray-500">Click to select/unselect a recipe</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedRecipes.map((r) => (
                  <div
                      key={r.id}
                      onClick={() => {
                        if (selectedRecipeId === r.id) {
                          // Unselect if already selected
                          setSelectedRecipeId(null);
                          setRecipeIngredients([]);
                        } else {
                          // Select if not already selected
                          setSelectedRecipeId(r.id);
                          setRecipeIngredients([]);
                        }
                      }}
                      className={`cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition transform hover:-translate-y-1 ${
                          selectedRecipeId === r.id ? "ring-2 ring-blue-500" : ""
                      }`}
                  >
                    <div className="relative">
                      <img
                          src={r.image ?? `https://spoonacular.com/recipeImages/${r.id}-556x370.jpg`}
                          alt={r.title}
                          className="w-full h-48 object-cover"
                      />
                      {selectedRecipeId === r.id && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 text-white p-1 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20"
                                   fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"/>
                              </svg>
                            </div>
                          </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-800">{r.title}</h3>
                    </div>
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
          {Object.keys(groceryProducts).length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Grocery Products</h2>
                <div className="space-y-8">
                  {Object.entries(groceryProducts).map(([ingredient, products]) => (
                      <div key={ingredient}>
                        <h3 className="text-lg font-bold mb-2">{ingredient}</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {products.map((product, idx) => {
                            const isSelected = selectedProducts[ingredient]?.name === product.name;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleSelectProduct(ingredient, product)}
                                    className={`cursor-pointer bg-white p-4 rounded-xl shadow border-2 transition ${
                                        isSelected ? "border-green-500" : "border-transparent hover:border-blue-300"
                                    }`}
                                >
                                  <h4 className="font-semibold">{product.name}</h4>
                                  <p className="text-sm text-gray-600">{product.brand}</p>
                                  <p className="text-sm mt-2">${product.price.toFixed(2)}</p>
                                  <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                                    {product.description}
                                  </div>
                                  {product.badges.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {product.badges.map((badge, bIdx) => (
                                            <span
                                                key={bIdx}
                                                className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                                            >
                                  {badge.replace("_", " ").toUpperCase()}
                                </span>
                                        ))}
                                      </div>
                                  )}
                                </div>
                            );
                          })}
                        </div>
                      </div>
                  ))}
                </div>

                <div className="mt-6 text-right font-semibold text-lg">
                  Total: ${totalCost.toFixed(2)}
                </div>
              </section>
          )}
        </main>
      </div>
  );
}