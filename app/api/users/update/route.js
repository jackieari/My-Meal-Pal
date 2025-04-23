// app/api/users/update/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { calculateCalories } from "@/lib/calorie-calculator";
import User from "@/models/User";
import { validateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(request) {
  try {
    console.log("PUT /api/users/update route hit");

    // Log cookies for debugging
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get("access-token");
    console.log(
      tokenCookie
        ? "Found access-token cookie: " + tokenCookie.value.slice(0, 10) + "..."
        : "No access-token cookie found"
    );

    // Validate JWT
    const decoded = await validateToken(request);
    if (!decoded?._id) {
      console.log("Token validation failed");
      return NextResponse.json(
        { message: "Unauthorized - Invalid or missing token" },
        { status: 401 }
      );
    }
    console.log("User authenticated with ID:", decoded._id);

    // Connect to DB
    await connectToDatabase();

    // Parse body
    const requestBody = await request.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));

    const {
      dietaryRestrictions,
      allergens,
      calorieLimit: manualCalorieLimit,
      bodyMetrics
    } = requestBody;

    // Build update object
    const updateData = { $set: {} };

    if (Array.isArray(dietaryRestrictions)) {
      updateData.$set["nutritionalPreferences.dietaryRestrictions"] = dietaryRestrictions;
    }
    if (Array.isArray(allergens)) {
      updateData.$set["nutritionalPreferences.allergens"] = allergens;
    }

    // If bodyMetrics provided, update them **and** recalc calories/macros
    if (bodyMetrics && typeof bodyMetrics === "object") {
      Object.keys(bodyMetrics).forEach((key) => {
        updateData.$set[`bodyMetrics.${key}`] = bodyMetrics[key];
      });

      const { dailyCalories, protein, carbs, fat } = calculateCalories(bodyMetrics);
      updateData.$set["nutritionalPreferences.calorieLimit"]   = dailyCalories;
      updateData.$set["nutritionalPreferences.macros.protein"] = protein;
      updateData.$set["nutritionalPreferences.macros.carbs"]   = carbs;
      updateData.$set["nutritionalPreferences.macros.fat"]     = fat;
    }
    // Otherwise, if a manual calorieLimit was sent, just update that
    else if (manualCalorieLimit !== undefined && manualCalorieLimit !== null) {
      updateData.$set["nutritionalPreferences.calorieLimit"] = Number(manualCalorieLimit);
    }

    console.log("Update data:", JSON.stringify(updateData, null, 2));
    console.log("Updating user with ID:", decoded._id);

    const user = await User.findByIdAndUpdate(decoded._id, updateData, { new: true });

    if (!user) {
      console.log("User not found with ID:", decoded._id);
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log("User updated successfully");
    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          nutritionalPreferences: user.nutritionalPreferences,
          bodyMetrics: user.bodyMetrics
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error.message
      },
      { status: 500 }
    );
  }
}
