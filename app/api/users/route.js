// app/api/users/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { calculateCalories } from "@/lib/calorie-calculator";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectToDatabase();

    const {
      name,
      email,
      password,
      nutritionalPreferences = {},
      bodyMetrics = {}
    } = await request.json();

    // check for existing user
    if (await User.findOne({ email })) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // compute calories & macros
    const { dailyCalories, protein, carbs, fat } = calculateCalories(bodyMetrics);

    // build nutritional preferences
    const userNutritionalPreferences = {
      dietaryRestrictions: nutritionalPreferences.dietaryRestrictions || [],
      allergens:           nutritionalPreferences.allergens          || [],
      calorieLimit:        dailyCalories,
      macros: { protein, carbs, fat }
    };

    // create & save new user
    const user = new User({
      name,
      email,
      passwordHash,
      nutritionalPreferences: userNutritionalPreferences,
      bodyMetrics
    });
    await user.save();

    // prepare response (omit passwordHash)
    const userResponse = {
      _id:                    user._id,
      name:                   user.name,
      email:                  user.email,
      nutritionalPreferences: user.nutritionalPreferences,
      bodyMetrics:            user.bodyMetrics,
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
