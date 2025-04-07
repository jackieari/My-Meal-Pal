"use client";

import { useEffect, useState } from "react";
import RecipeList from "../components/RecipeList";
import IngredientsList from "../components/IngredientsList";

const CUISINES = [
    "All",
    "African", "American", "British", "Cajun", "Caribbean", "Chinese", "Eastern European",
    "European", "French", "German", "Greek", "Indian", "Irish", "Italian", "Japanese",
    "Jewish", "Korean", "Latin American", "Mediterranean", "Mexican", "Middle Eastern",
    "Nordic", "Southern", "Spanish", "Thai", "Vietnamese"
];

export default function ResultsClient() {
    const [ingredients, setIngredients] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [cuisine, setCuisine] = useState("All");

    // New filter states
    const [maxReadyTime, setMaxReadyTime] = useState("");
    const [minServings, setMinServings] = useState("");
    const [maxCarbs, setMaxCarbs] = useState("");
    const [maxCalories, setMaxCalories] = useState("");

    useEffect(() => {
        const storedIngredients = localStorage.getItem("detectedIngredients");
        const storedCuisine = localStorage.getItem("selectedCuisine");

        if (storedIngredients) {
            setIngredients(JSON.parse(storedIngredients));
        }

        if (storedCuisine) {
            setCuisine(storedCuisine);
        }
    }, []);

    const handleSubmit = async () => {
        const selectedCuisine = cuisine === "All" ? "" : cuisine;

        localStorage.setItem("selectedCuisine", cuisine);

        const filters = {
            ingredients,
            cuisine: selectedCuisine,
            maxReadyTime: maxReadyTime ? Number(maxReadyTime) : undefined,
            minServings: minServings ? Number(minServings) : undefined,
            maxCarbs: maxCarbs ? Number(maxCarbs) : undefined,
            maxCalories: maxCalories ? Number(maxCalories) : undefined,
        };

        const res = await fetch("/api/spoonacular", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(filters),
        });

        const data = await res.json();
        console.log("Spoonacular API response:", data);

        if (data.success && Array.isArray(data.recipes)) {
            setRecipes(data.recipes);
        } else {
            console.error("Unexpected recipes format", data.recipes);
            setRecipes([]);
        }
    };

    return (
        <div className="space-y-12 p-4">
            <section>
                <h3 className="text-2xl font-semibold mb-4">Your Ingredients</h3>
                <IngredientsList ingredients={ingredients} />
            </section>

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

                    {/* Filters */}
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
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition self-start"
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                </div>
            </section>

            <section>
                <h3 className="text-2xl font-semibold mb-4">Recipes You Can Make</h3>
                <RecipeList recipes={recipes} />
            </section>
        </div>
    );
}