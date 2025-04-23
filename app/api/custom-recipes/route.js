import { connectToDatabase } from "@/lib/mongodb"; // adjust path if needed
import CustomRecipe from "@/models/CustomRecipe";

// GET method to fetch all recipes
export async function GET(req) {
  try {
    await connectToDatabase();
    const recipes = await CustomRecipe.find().sort({ createdAt: -1 });
    return Response.json(recipes);
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch recipes" }), {
      status: 500,
    });
  }
}

// POST method to create a new recipe
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const newRecipe = await CustomRecipe.create({
      title: body.title,
      ingredients: body.ingredients,
      bio: body.bio,
      instructions: body.instructions,
      prepTime: body.prepTime,
      userEmail: body.userEmail,
    });

    return Response.json(newRecipe);
  } catch (error) {
    console.error("POST /api/custom-recipes error:", error);
    return new Response(JSON.stringify({ error: "Failed to create recipe" }), {
      status: 500,
    });
  }
}

// DELETE method to delete a recipe
export async function DELETE(req) {
  try {
    const { id } = req.params; // Get the recipe ID from the URL parameters
    await connectToDatabase();

    const deletedRecipe = await CustomRecipe.findByIdAndDelete(id); // Delete the recipe by ID

    if (!deletedRecipe) {
      return new Response(
        JSON.stringify({ error: "Recipe not found" }),
        { status: 404 }
      );
    }

    return Response.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/custom-recipes error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete recipe" }),
      { status: 500 }
    );
  }
}