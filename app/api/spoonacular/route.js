import { NextResponse } from "next/server";

export async function POST(req) {
    const body = await req.json();
    const ingredients = body.ingredients || [];
    const apiKey = "6dbe894a7eca433e92d0c04f82c64323";
    const query = ingredients.join(",");
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${query}&number=10&ranking=1&ignorePantry=true&apiKey=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        // Fetch detailed recipe information for each recipe
        const detailedRecipes = await Promise.all(
            data.map(async (recipe) => {
                const recipeUrl = `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${apiKey}`;
                const recipeRes = await fetch(recipeUrl);
                const recipeData = await recipeRes.json();
                return {
                    ...recipe,
                    url: recipeData.sourceUrl, // Use the full source URL from the detailed API
                    instructions: recipeData.instructions,
                };
            })
        );

        return NextResponse.json({ success: true, recipes: detailedRecipes });
    } catch (error) {
        console.error("Spoonacular error:", error);
        return NextResponse.json({ success: false, recipes: [] });
    }
}