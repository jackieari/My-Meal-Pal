"use client";

import { useState } from "react";

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [images, setImages] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch all recipes
  const fetchRecipes = async () => {
    try {
      const response = await fetch("/api/recipes");
      if (!response.ok) throw new Error("Failed to fetch recipes");

      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Post a new recipe
  const postRecipe = async () => {
    const newRecipe = {
      title: "Test Recipe",
      ingredients: ["Ingredient 1", "Ingredient 2"],
      instructions: "Mix ingredients and enjoy!",
    };

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipe),
      });

      if (!response.ok) throw new Error("Failed to add recipe");

      alert("Recipe added!");
      fetchRecipes();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Fetch all images
  const fetchImages = async () => {
    try {
      const response = await fetch("/api/images");
      if (!response.ok) throw new Error("Failed to fetch images");

      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Upload an image
  const postImage = async () => {
    const newImage = {
      filename: "test-image.jpg",
      imageUrl: "https://via.placeholder.com/150", // Replace with actual upload logic
    };

    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newImage),
      });

      if (!response.ok) throw new Error("Failed to upload image");

      alert("Image uploaded!");
      fetchImages();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Register a new user
  const postUser = async () => {
    const newUser = {
      name: "John Doe",
      email: "john@example.com",
      passwordHash: "hashedpassword123", // Replace with real hashing
      nutritionalPreferences: {
        dietaryRestrictions: ["vegan"],
        calorieLimit: 2000,
        allergens: ["nuts"],
      },
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) throw new Error("Failed to add user");

      alert("User registered!");
      fetchUsers();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">MongoDB App</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={fetchRecipes}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Fetch Recipes
        </button>
        <button
          onClick={fetchImages}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          Fetch Images
        </button>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
        >
          Fetch Users
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={postRecipe}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          Post Recipe
        </button>
        <button
          onClick={postImage}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
        >
          Upload Image
        </button>
        <button
          onClick={postUser}
          className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition"
        >
          Register User
        </button>
      </div>

      <div className="w-full max-w-md">
        <h2 className="text-xl font-semibold mb-2">Recipes</h2>
        <ul>
          {recipes.length > 0 ? (
            recipes.map((recipe, index) => (
              <li key={index} className="p-2 bg-white shadow rounded my-2">
                <strong>{recipe.title}</strong>
                <p className="text-sm text-gray-600">{recipe.ingredients.join(", ")}</p>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No recipes found</p>
          )}
        </ul>
      </div>

      <div className="w-full max-w-md mt-6">
        <h2 className="text-xl font-semibold mb-2">Images</h2>
        <ul>
          {images.length > 0 ? (
            images.map((image, index) => (
              <li key={index} className="p-2 bg-white shadow rounded my-2 flex items-center">
                <img src={image.imageUrl} alt={image.filename} className="w-16 h-16 mr-2 rounded" />
                <span className="text-sm text-gray-600">{image.filename}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No images found</p>
          )}
        </ul>
      </div>

      <div className="w-full max-w-md mt-6">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <ul>
          {users.length > 0 ? (
            users.map((user, index) => (
              <li key={index} className="p-2 bg-white shadow rounded my-2">
                <strong>{user.name}</strong>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500">Preferences: {user.nutritionalPreferences.dietaryRestrictions.join(", ")}</p>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No users found</p>
          )}
        </ul>
      </div>
    </div>
  );
}