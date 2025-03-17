import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase()

    // Parse the request body
    const body = await request.json()
    const { email, password } = body

    console.log("Login attempt for:", email)

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find the user by email
    const user = await User.findOne({ email })

    // Check if user exists
    if (!user) {
      console.log("User not found:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      console.log("Invalid password for:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Login successful for:", email)

    // Create a simple session identifier - just use the user ID
    const sessionId = user._id.toString()

    // Get the cookies store
    const cookieStore = cookies()

    // Set multiple cookies for better compatibility

    // Set session cookie
    cookieStore.set({
      name: "session",
      value: sessionId,
      httpOnly: false, // Changed to false so client JS can read it
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from strict to lax for better compatibility
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    // Also set access-token cookie for backward compatibility
    cookieStore.set({
      name: "access-token",
      value: sessionId,
      httpOnly: false, // Changed to false so client JS can read it
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("Auth cookies set:", sessionId)

    // Return user data (excluding sensitive information)
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        nutritionalPreferences: user.nutritionalPreferences || {},
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

