import { connectToDatabase } from "@/lib/mongodb";
import Recipe from "@/models/Recipe";

export async function GET() {
  await connectToDatabase();
  const recipes = await Recipe.find({});
  return Response.json(recipes);
}

export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();

  const newRecipe = new Recipe(data);
  await newRecipe.save();

  return Response.json(newRecipe, { status: 201 });
}