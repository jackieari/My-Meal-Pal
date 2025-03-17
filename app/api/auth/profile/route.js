// app/api/profile/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

// Helper function to get the authenticated user
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

// GET: Fetch the user's profile
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Return user data (excluding sensitive information)
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        nutritionalPreferences: user.nutritionalPreferences
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT: Update the user's profile
export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, nutritionalPreferences } = body;
    
    // Update allowed fields
    if (name) user.name = name;
    
    if (nutritionalPreferences) {
      // Update nutritional preferences
      if (nutritionalPreferences.dietaryRestrictions !== undefined) {
        user.nutritionalPreferences.dietaryRestrictions = nutritionalPreferences.dietaryRestrictions;
      }
      
      if (nutritionalPreferences.allergens !== undefined) {
        user.nutritionalPreferences.allergens = nutritionalPreferences.allergens;
      }
      
      if (nutritionalPreferences.calorieLimit !== undefined) {
        user.nutritionalPreferences.calorieLimit = nutritionalPreferences.calorieLimit;
      }
    }
    
    // Save the updated user
    await user.save();
    
    // Return updated user data
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        nutritionalPreferences: user.nutritionalPreferences
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// DELETE: Delete the user's account
export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Delete the user
    await User.findByIdAndDelete(user._id);
    
    // Clear the session cookie
    const cookieStore = cookies();
    cookieStore.set({
      name: "session",
      value: "",
      expires: new Date(0),
      path: "/"
    });
    
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}