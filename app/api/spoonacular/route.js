import { NextResponse } from "next/server";

export async function POST(req) {
    const body = await req.json();
    const ingredients = body.ingredients || [];
    const apiKey = "9b7d827bda4b4594ac9518c5f8d0a47c";
    const query = ingredients.join(",");
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${query}&number=10&ranking=1&ignorePantry=true&apiKey=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        // Fetch detailed recipe information including nutrition
        const detailedRecipes = await Promise.all(
            data.map(async (recipe) => {
                const recipeUrl = `https://api.spoonacular.com/recipes/${recipe.id}/information?includeNutrition=true&apiKey=${apiKey}`;
                const recipeRes = await fetch(recipeUrl);
                const recipeData = await recipeRes.json();

                const calories = recipeData.nutrition?.nutrients?.find(n => n.name === "Calories");

                return {
                    ...recipe,
                    url: recipeData.sourceUrl,
                    instructions: recipeData.instructions,
                    nutrition: recipeData.nutrition?.nutrients || [],
                    calories: calories?.amount ? `${Math.round(calories.amount)} kcal` : "N/A",
                };
            })
        );

        return NextResponse.json({ success: true, recipes: detailedRecipes });
    } catch (error) {
        console.error("Spoonacular error:", error);
        return NextResponse.json({ success: false, recipes: [] });
    }
}