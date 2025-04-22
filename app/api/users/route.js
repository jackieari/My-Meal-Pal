// app/api/users/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";  // ✅ named import
import User from "@/models/User";

export async function POST(request) {
  try {
    // connect to MongoDB
    await connectToDatabase();

    // parse body
    const { name, email, password, nutritionalPreferences } = await request.json();

    // check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // build nutritional preferences
    const userNutritionalPreferences = {
      dietaryRestrictions: nutritionalPreferences?.dietaryRestrictions || [],
      allergens:               nutritionalPreferences?.allergens          || [],
      calorieLimit:            nutritionalPreferences?.calorieLimit      ?? null,
    };

    // create & save new user
    const user = new User({
      name,
      email,
      passwordHash,
      nutritionalPreferences: userNutritionalPreferences,
    });
    await user.save();

    // prepare response payload (omit passwordHash)
    const userResponse = {
      _id:                    user._id,
      name:                   user.name,
      email:                  user.email,
      nutritionalPreferences: user.nutritionalPreferences,
      createdAt:              user.createdAt,
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
