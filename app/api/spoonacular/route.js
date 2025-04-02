
import { NextResponse } from "next/server";

export async function POST(req) {
    const body = await req.json();
    const ingredients = body.ingredients || [];
    const apiKey = "6dbe894a7eca433e92d0c04f82c64323";
    const query = ingredients.join(",");
    // You can adjust parameters like ranking and ignorePantry as needed.
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${query}&number=10&ranking=1&ignorePantry=true&apiKey=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        return NextResponse.json({ success: true, recipes: data });
    } catch (error) {
        console.error("Spoonacular error:", error);
        return NextResponse.json({ success: false, recipes: [] });
    }
}
