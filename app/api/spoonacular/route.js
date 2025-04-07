import { NextResponse } from "next/server";

export async function POST(req) {
    const body = await req.json();
    const ingredients = body.ingredients || [];
    const cuisine = body.cuisine || "";
    const apiKey = "9b7d827bda4b4594ac9518c5f8d0a47c";

    const query = ingredients.join(",");
    const url = `https://api.spoonacular.com/recipes/complexSearch` +
        `?includeIngredients=${query}` +
        `&cuisine=${encodeURIComponent(cuisine)}` +
        `&number=10` +
        `&addRecipeInformation=true` +
        `&addRecipeInstructions=true` +
        `&addRecipeNutrition=true` +
        `&apiKey=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        const detailedRecipes = (data.results || []).map(recipe => {
            const calories = recipe.nutrition?.nutrients?.find(n => n.name === "Calories");

            return {
                id: recipe.id,
                title: recipe.title,
                image: recipe.image,
                url: recipe.sourceUrl,
                instructions: recipe.analyzedInstructions || [],
                nutrition: recipe.nutrition?.nutrients || [],
                calories: calories?.amount ? `${Math.round(calories.amount)} kcal` : "N/A",
                extendedIngredients: recipe.extendedIngredients || [],
            };
        });

        return NextResponse.json({ success: true, recipes: detailedRecipes });
    } catch (error) {
        console.error("Spoonacular error:", error);
        return NextResponse.json({ success: false, recipes: [] });
    }
}