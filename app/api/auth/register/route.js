import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const body = await request.json();
    const { name, email, password, nutritionalPreferences } = body;

    console.log("Registration attempt for:", email);

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("User already exists:", email);
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create a new user, ensuring nutritionalPreferences is included
    const newUser = new User({
      name,
      email,
      passwordHash,
      nutritionalPreferences: nutritionalPreferences || {
        dietaryRestrictions: [],
        allergens: [],
        calorieLimit: null,
      },
    });

    // Save the user to the database
    await newUser.save();

    console.log("Registration successful for:", email);
    console.log("User nutritionalPreferences:", newUser.nutritionalPreferences);

    // Return success response
    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        nutritionalPreferences: newUser.nutritionalPreferences,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
