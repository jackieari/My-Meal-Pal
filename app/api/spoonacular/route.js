import { NextResponse } from "next/server";

export async function POST(req) {
    const body = await req.json();
    const ingredients = body.ingredients || [];
    const cuisine = body.cuisine || "";

    const maxReadyTime = body.maxReadyTime;
    const minServings = body.minServings;
    const maxCarbs = body.maxCarbs;
    const maxCalories = body.maxCalories;

    const apiKey = "ac4c7b1e98a04d4b98af48492b8af972";  // Replace with env var in production
    const dietaryRestrictions = body.dietaryRestrictions || [];
    const allergens = body.allergens || [];

    const query = ingredients.join(",");
    let url = `https://api.spoonacular.com/recipes/complexSearch` +
        `?includeIngredients=${query}` +
        `&cuisine=${encodeURIComponent(cuisine)}` +
        `&number=20` +
        `&fillIngredients=true` +
        `&addRecipeInformation=true` +
        `&addRecipeInstructions=true` +
        `&addRecipeNutrition=true` +
        `&apiKey=${apiKey}`;

    if (dietaryRestrictions.length > 0) {
        // Join multiple with comma (AND logic), or use pipe (|) if you want OR logic
        url += `&diet=${encodeURIComponent(dietaryRestrictions.join(","))}`;
    }

    if (allergens.length > 0) {
        url += `&intolerances=${encodeURIComponent(allergens.join(","))}`;
    }

    if (maxReadyTime) {
        url += `&maxReadyTime=${maxReadyTime}`;
    }

    try {
        // 1) Try with the full list of ingredients
        let data = await (await fetch(url)).json();

        // 2) If no results, try each ingredient on its own
        if ((!data.results || data.results.length === 0) && ingredients.length > 1) {
            for (let ingr of ingredients) {
                const singleUrl = url.replace(
                    /includeIngredients=[^&]*/,
                    `includeIngredients=${encodeURIComponent(ingr)}`
                );
                const attemptRes = await fetch(singleUrl);
                const attempt = await attemptRes.json();
                if (attempt.results && attempt.results.length > 0) {
                    data = attempt;
                    break;
                }
            }
        }

        const detailedRecipes = (data.results || [])
            .filter(recipe => {
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
            })
            .map(recipe => {
                const calories = recipe.nutrition?.nutrients?.find(n => n.name === "Calories");
                return {
                    recipeId: recipe.id,
                    title: recipe.title,
                    image: recipe.image,
                    url: recipe.sourceUrl,
                    instructions: recipe.analyzedInstructions || [],
                    nutrition: recipe.nutrition?.nutrients || [],
                    calories: calories?.amount ? `${Math.round(calories.amount)} kcal` : "N/A",
                    extendedIngredients: recipe.extendedIngredients || [],
                    usedIngredients: recipe.usedIngredients || [],
                    missedIngredients: recipe.missedIngredients || [],
                    usedIngredientCount: recipe.usedIngredientCount || 0,
                    missedIngredientCount: recipe.missedIngredientCount || 0,
                };
            });

        return NextResponse.json({ success: true, recipes: detailedRecipes });
    } catch (error) {
        console.error("Spoonacular error:", error);
        return NextResponse.json({ success: false, recipes: [] });
    }
}