"use client";

import { useEffect, useState } from "react";
import RecipeList from "../components/RecipeList";
import IngredientsList from "../components/IngredientsList";

export default function ResultsClient() {
    const [ingredients, setIngredients] = useState([]);
    const [recipes, setRecipes] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem("detectedIngredients");
        if (!stored) return;
        const parsed = JSON.parse(stored);
        setIngredients(parsed);

        fetch("/api/spoonacular", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredients: parsed }),
        })
            .then((res) => res.json())
            .then((data) => {
                console.log("Spoonacular API response:", data);
                if (data.success && Array.isArray(data.recipes)) {
                    setRecipes(data.recipes);
                } else {
                    console.error("Unexpected recipes format", data.recipes);
                    setRecipes([]);
                }
            })
            .catch((err) => console.error("Error fetching recipes:", err));
    }, []);

    return (
        <div className="space-y-12 p-4">
            <section>
                <h3 className="text-2xl font-semibold mb-4">Your Ingredients</h3>
                <IngredientsList ingredients={ingredients} />
            </section>
            <section>
                <h3 className="text-2xl font-semibold mb-4">Recipes You Can Make</h3>
                <RecipeList recipes={recipes} />
            </section>
        </div>
    );
}