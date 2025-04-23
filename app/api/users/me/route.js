// app/api/users/route.js (GET)
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request) {
  try {
    // Get the session cookie
    const cookieStore   = cookies();
    const sessionCookie = cookieStore.get("session");

    // Check for Authorization header (token-based)
    const authHeader = request.headers.get("Authorization");
    let userId = null;

    if (sessionCookie?.value) {
      // session format: userId[_timestamp]
      userId = sessionCookie.value.split("_")[0];
      console.log("Found user ID in session cookie:", userId);
    }
    else if (authHeader?.startsWith("Bearer ")) {
      // NOTE: in prod you'd verify a JWT here
      userId = authHeader.substring(7);
      console.log("Found user ID in Authorization header:", userId);
    }

    if (!userId) {
      console.log("No user ID found in cookies or headers");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Connect & fetch
    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found with ID:", userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    console.log("User found:", user.email);

    // Build response payload
    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          nutritionalPreferences: {
            dietaryRestrictions: user.nutritionalPreferences.dietaryRestrictions,
            allergens:            user.nutritionalPreferences.allergens,
            calorieLimit:         user.nutritionalPreferences.calorieLimit,
            macros:               user.nutritionalPreferences.macros || { protein:0, carbs:0, fat:0 }
          },
          bodyMetrics: user.bodyMetrics || {}
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting user info:", error);
    return NextResponse.json(
      { error: "Failed to get user information" },
      { status: 500 }
    );
  }
}
