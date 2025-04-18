import { NextResponse } from "next/server";

export async function POST(req) {
    const body = await req.json();
    const ingredients = body.ingredients || [];
    const cuisine = body.cuisine || "";

    const maxReadyTime = body.maxReadyTime;
    const minServings = body.minServings;
    const maxCarbs = body.maxCarbs;
    const maxCalories = body.maxCalories;

    const dietaryRestrictions = body.dietaryRestrictions || [];  // diet -> dietaryRestrictions
    const allergens = body.allergens || [];  // allergens -> intolerances

    const apiKey = "6f3e35ad7c004cc28796a5e46e86931f";  // Ensure this is your actual API key

    const query = ingredients.join(",");
    const dietParam = dietaryRestrictions.length > 0 ? `&diet=${dietaryRestrictions.join(",")}` : "";
    const intolerancesParam = allergens.length > 0 ? `&intolerances=${allergens.join(",")}` : "";

    let url = `https://api.spoonacular.com/recipes/complexSearch` +
        `?includeIngredients=${query}` +
        `&cuisine=${encodeURIComponent(cuisine)}` +
        `&number=20` +  // Increased to allow some margin for post-filtering
        `&addRecipeInformation=true` +
        `&addRecipeInstructions=true` +
        `&addRecipeNutrition=true` +
        `&apiKey=${apiKey}` +
        dietParam +  // Add diet directly
        intolerancesParam;  // Add intolerances directly

    // Add optional filters (maxReadyTime, maxCalories, maxCarbs, minServings)
    if (maxReadyTime) {
        url += `&maxReadyTime=${maxReadyTime}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();

        const detailedRecipes = (data.results || []).filter(recipe => {
            // Calories and carbs filtering
            const nutrients = recipe.nutrition?.nutrients || [];
            const caloriesObj = nutrients.find(n => n.name === "Calories");
            const carbsObj = nutrients.find(n => n.name === "Carbohydrates");

            const calories = caloriesObj?.amount || 0;
            const carbs = carbsObj?.amount || 0;
            const servings = recipe.servings || 0;

            if (maxCalories && calories > maxCalories) return false;
            if (maxCarbs && carbs > maxCarbs) return false;
            if (minServings && servings < minServings) return false;

            return true;
        }).map(recipe => {
            const calories = recipe.nutrition?.nutrients?.find(n => n.name === "Calories");

            return {
                recipeId: recipe.id, // Ensure we pass recipeId here
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
