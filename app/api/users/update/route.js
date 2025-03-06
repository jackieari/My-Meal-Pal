import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";  // Adjust import based on your MongoDB setup
import User from "@/models/User"; // Adjust based on where your User model is located
import { validateToken } from "@/lib/auth"; // Adjust if you have a custom auth helper

export async function PUT(req) {
  try {
    // Validate the JWT token from the request
    const token = validateToken(req); // Ensure this function gets the token from headers

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Connect to the MongoDB database
    await connectToDatabase();

    // Parse the incoming JSON request body
    const { dietaryRestrictions, calorieLimit, allergens } = await req.json();

    // Update the user's nutritional preferences
    const user = await User.findByIdAndUpdate(
      token._id, // Token contains the user's _id
      {
        $set: {
          "nutritionalPreferences.dietaryRestrictions": dietaryRestrictions,
          "nutritionalPreferences.calorieLimit": calorieLimit,
          "nutritionalPreferences.allergens": allergens,
        },
      },
      { new: true } // Return the updated user document
    );

    // If no user is found, return a 404 error
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return a success response
    return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}