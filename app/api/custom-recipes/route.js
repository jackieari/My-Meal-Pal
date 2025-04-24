import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"; // adjust path if needed
import CustomRecipe from "@/models/CustomRecipe";

// GET method to fetch all recipes
export async function GET(req) {
  try {
    await connectToDatabase();
    const recipes = await CustomRecipe.find().sort({ createdAt: -1 });
    return NextResponse.json(recipes);
  } catch  {
    return NextResponse.json(
        { error: "Failed to fetch recipes" },
        { status: 500 }
    )
  }
}

// POST method to create a new recipe
export async function POST(req) {
  try {
    await connectToDatabase()
    const body = await req.json()
    const newRecipe = await CustomRecipe.create({
      title: body.title,
      ingredients: body.ingredients,
      bio: body.bio,
      instructions: body.instructions,
      prepTime: body.prepTime,
      userEmail: body.userEmail,
    })
    return NextResponse.json(newRecipe)
  } catch (error) {
    console.error("POST /api/custom-recipes error:", error)
    return NextResponse.json(
        { error: "Failed to create recipe" },
        { status: 500 }
    )
  }
}
