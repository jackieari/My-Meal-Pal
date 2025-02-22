import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb"; // ✅ FIXED: Named Import
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectToDatabase(); // ✅ Ensure MongoDB connection

    const { name, email, password, nutritionalPreferences } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      passwordHash, // Save hashed password in the correct field
      nutritionalPreferences: nutritionalPreferences || {} // Store nutritional preferences if provided
    });

    await newUser.save();

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
