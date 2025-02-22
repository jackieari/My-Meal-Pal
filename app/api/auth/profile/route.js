import { NextResponse } from "next/server";
import { validateToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

// ✅ GET request to retrieve user profile
export async function GET(req) {
  try {
    await connectToDatabase();

    // Validate JWT token
    const userToken = validateToken(req);
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find user in the database
    const user = await User.findOne({ email: userToken.email }).select("-passwordHash");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User profile retrieved", user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

// ✅ PUT request to update user profile
export async function PUT(req) {
  try {
    await connectToDatabase();

    // Validate JWT token
    const userToken = validateToken(req);
    if (!userToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, nutritionalPreferences } = await req.json();

    // Update user profile
    const updatedUser = await User.findOneAndUpdate(
      { email: userToken.email },
      { name, nutritionalPreferences },
      { new: true, select: "-passwordHash" }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
