import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";  // Adjust the path to your mongodb.js
import User from "@/models/User";
import UserLike from "@/models/UserLike";

// Helper function to get the authenticated user from cookies
async function getAuthenticatedUser() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  // Extract user ID from session (assuming format: userId_timestamp)
  const userId = sessionCookie.value.split("_")[0];

  await connectToDatabase();
  return await User.findById(userId);
}

// GET: Fetch the user's liked recipes
export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get all liked recipes for the user
    const userLikes = await UserLike.find({ userId: user._id }).populate("recipeId");
    const likedRecipes = userLikes.map((like) => like.recipeId);

    return NextResponse.json({ recipes: likedRecipes });
  } catch (error) {
    console.error("Error fetching liked recipes:", error);
    return NextResponse.json({ error: "Failed to fetch liked recipes" }, { status: 500 });
  }
}

// POST: Like or unlike a recipe
export async function POST(request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { recipeId } = await request.json(); // Extract recipeId from the request body

  if (!recipeId) {
    return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 });
  }

  try {
    // Check if the user has already liked the recipe
    const existingLike = await UserLike.findOne({ userId: user._id, recipeId });

    if (existingLike) {
      // If the recipe is already liked, unlike it by deleting the record
      await UserLike.deleteOne({ _id: existingLike._id });
      return NextResponse.json({ message: "Recipe unliked successfully" });
    } else {
      // If the recipe is not liked, create a new like record
      const newLike = new UserLike({ userId: user._id, recipeId });
      await newLike.save();
      return NextResponse.json({ message: "Recipe liked successfully" });
    }
  } catch (error) {
    console.error("Error toggling like status:", error);
    return NextResponse.json({ error: "Failed to toggle like status" }, { status: 500 });
  }
}
