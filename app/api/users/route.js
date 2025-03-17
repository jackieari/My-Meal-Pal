import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/db"
import User from "@/models/User"

export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()
    const { name, email, password, nutritionalPreferences } = body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Ensure calorieLimit is properly set
    const userNutritionalPreferences = {
      dietaryRestrictions: nutritionalPreferences?.dietaryRestrictions || [],
      allergens: nutritionalPreferences?.allergens || [],
      calorieLimit: nutritionalPreferences?.calorieLimit || null,
    }

    // Create new user
    const user = new User({
      name,
      email,
      passwordHash,
      nutritionalPreferences: userNutritionalPreferences,
    })

    await user.save()

    // Return the user without the password hash
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      nutritionalPreferences: user.nutritionalPreferences,
      createdAt: user.createdAt,
    }

    return NextResponse.json(userResponse, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

