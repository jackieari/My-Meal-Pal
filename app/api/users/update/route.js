// app/api/users/update/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { validateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(request) {
  try {
    console.log("PUT /api/users/update route hit");
    
    // Get all cookies for logging
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get("access-token");
    
    if (tokenCookie) {
      console.log("Found access-token cookie:", tokenCookie.value.substring(0, 10) + "...");
    } else {
      console.log("No access-token cookie found");
    }
    
    // Validate the token
    const decoded = await validateToken(request);
    
    if (!decoded || !decoded._id) {
      console.log("Token validation failed");
      return NextResponse.json({ message: "Unauthorized - Invalid or missing token" }, { status: 401 });
    }

    console.log("User authenticated with ID:", decoded._id);

    // Connect to the MongoDB database
    await connectToDatabase();

    // Parse the incoming JSON request body
    const requestBody = await request.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));
    
    const { dietaryRestrictions, calorieLimit, allergens, bodyMetrics } = requestBody;

    // Create the update object
    const updateData = {
      $set: {
        "nutritionalPreferences.dietaryRestrictions": Array.isArray(dietaryRestrictions) ? dietaryRestrictions : [],
        "nutritionalPreferences.allergens": Array.isArray(allergens) ? allergens : [],
      }
    };
    
    // Only set calorieLimit if it's not null or undefined
    if (calorieLimit !== undefined && calorieLimit !== null) {
      updateData.$set["nutritionalPreferences.calorieLimit"] = Number(calorieLimit);
    }

    // Add body metrics to the update if provided
    if (bodyMetrics && typeof bodyMetrics === 'object') {
      Object.keys(bodyMetrics).forEach(key => {
        updateData.$set[`bodyMetrics.${key}`] = bodyMetrics[key];
      });
    }

    console.log("Update data:", JSON.stringify(updateData, null, 2));
    console.log("Updating user with ID:", decoded._id);

    // Update the user
    const user = await User.findByIdAndUpdate(
      decoded._id,
      updateData,
      { new: true }
    );

    if (!user) {
      console.log("User not found with ID:", decoded._id);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("User updated successfully");
    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        nutritionalPreferences: user.nutritionalPreferences,
        bodyMetrics: user.bodyMetrics
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ 
      message: "Internal Server Error", 
      error: error.message 
    }, { status: 500 });
  }
}