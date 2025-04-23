"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function CustomRecipes() {
  const [userEmail, setUserEmail] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    ingredients: "",
    bio: "",
    instructions: "",
    prepTime: "",
  });
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(true); // Toggle between recipe creation and search
  const router = useRouter();

  useEffect(() => {
    fetchUserInfo();
    fetchRecipes();
  }, []);

  const fetchUserInfo = async () => {
    let token = null;
    const cookies = document.cookie.split(";").map((c) => c.trim());

    for (const cookie of cookies) {
      if (cookie.startsWith("access-token=")) token = cookie.substring("access-token=".length);
      else if (cookie.startsWith("token=")) token = cookie.substring("token=".length);
      else if (cookie.startsWith("next-auth.session-token=")) token = cookie.substring("next-auth.session-token=".length);
      else if (cookie.startsWith("session=")) token = cookie.substring("session=".length);
    }

    token ||= localStorage.getItem("token") || localStorage.getItem("access-token");
    if (!token) return;

    const res = await fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setUserEmail(data.user?.email || "");
    }
  };

  const fetchRecipes = async () => {
    try {
      const res = await fetch("/api/custom-recipes");
      const data = await res.json();
      setRecipes(data);
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      ingredients: formData.ingredients.split(",").map((i) => i.trim()),
      userEmail,
    };

    const res = await fetch("/api/custom-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setFormData({
        title: "",
        ingredients: "",
        bio: "",
        instructions: "",
        prepTime: "",
      });
      fetchRecipes();
      setIsCreating(false); // Switch to the search view after successful submission
    } else {
      console.error("Failed to submit recipe");
    }
  };

  const deleteRecipe = async (recipeId) => {
    try {
      const res = await fetch(`/api/custom-recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Refresh the recipes list after deletion
        fetchRecipes();
      } else {
        console.error("Failed to delete recipe");
      }
    } catch (err) {
      console.error("Error deleting recipe:", err);
    }
  };

  // Filtered recipes based on search term
  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchTerm) ||
      recipe.prepTime.toLowerCase().includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-8">
      <button
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
        onClick={() => router.push("/home")}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to Home</span>
      </button>

      <div className="mt-4 text-center">
        <h1 className="text-3xl font-semibold">Custom Recipes</h1>
        {userEmail ? (
          <p className="text-gray-700 mt-2">
            <strong>Create and Save Your Custom Recipes!</strong>
          </p>
        ) : (
          <p className="text-gray-500 mt-2">Fetching user info...</p>
        )}
      </div>

      {/* Recipe Creation Section */}
      {isCreating ? (
        <div className="max-w-3xl mx-auto space-y-6 transition-all">
          <h2 className="text-2xl font-semibold text-center">Create a New Recipe</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="title"
              placeholder="Recipe Name"
              value={formData.title}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg"
              required
            />
            <input
              type="text"
              name="ingredients"
              placeholder="Ingredients (comma-separated)"
              value={formData.ingredients}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg"
              required
            />
            <input
              type="text"
              name="bio"
              placeholder="Short description"
              value={formData.bio}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg"
            />
            <textarea
              name="instructions"
              placeholder="Instructions"
              value={formData.instructions}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg"
              required
            />
            <input
              type="text"
              name="prepTime"
              placeholder="Prep Time (e.g. 15 minutes)"
              value={formData.prepTime}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg"
              required
            />
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg w-1/2"
              >
                Submit Recipe
              </button>
              <button
                type="button"
                onClick={fetchRecipes}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg w-1/2"
              >
                Refresh Recipes
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Switch back to Recipe Creation */}
      {!isCreating && (
        <div className="text-center mt-4">
          <button
            onClick={() => setIsCreating(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg"
          >
            Go Back to Create Recipe
          </button>
        </div>
      )}

      {/* Search Bar Section */}
      <div className="mt-8 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-center mb-4">Search Recipes</h2>
        <input
          type="text"
          placeholder="Search by recipe name or prep time"
          value={searchTerm}
          onChange={handleSearch}
          className="border border-gray-300 p-3 w-full rounded-lg"
        />
        <div className="mt-4 text-center text-gray-700">
          <p>
            {filteredRecipes.length} {filteredRecipes.length === 1 ? "result" : "results"} found
          </p>
        </div>
      </div>

      {/* Recipe List (Side-by-side layout) */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
                <div
                    key={recipe._id}
                    className="border p-6 rounded-lg shadow-md bg-white"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-bold">{recipe.title}</h3>
                    <button
                        onClick={() => deleteRecipe(recipe._id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        aria-label="Delete recipe"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{recipe.bio}</p>
                  <p className="mt-4">
                    <strong>Prep Time:</strong> {recipe.prepTime}
                  </p>
                  <p className="mt-2">
                    <strong>Ingredients:</strong> {recipe.ingredients.join(", ")}
                  </p>
                  <p className="mt-4">{recipe.instructions}</p>
                </div>
            ))
        ) : (
            <p className="text-center text-gray-500">No recipes found.</p>
        )}
      </div>
    </div>
  );
}