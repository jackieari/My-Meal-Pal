import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

export async function GET(request) {
  try {
    // Get the session cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")

    // Check for Authorization header (for token-based auth)
    const authHeader = request.headers.get("Authorization")
    let userId = null

    // First try to get user ID from session cookie
    if (sessionCookie?.value) {
      // Parse the session ID (assuming format: userId or userId_timestamp)
      const sessionParts = sessionCookie.value.split("_")
      userId = sessionParts[0]
      console.log("Found user ID in session cookie:", userId)
    }
    // If no session cookie, try Authorization header
    else if (authHeader && authHeader.startsWith("Bearer ")) {
      // This is a simplified example - in a real app, you'd verify the JWT token
      // For now, we'll just assume the token is the user ID for demonstration
      const token = authHeader.substring(7) // Remove "Bearer " prefix

      // In a real app, you'd decode and verify the token
      // For this example, we'll just use it directly (not recommended for production)
      userId = token
      console.log("Found user ID in Authorization header:", userId)
    }

    // If no user ID found, return unauthorized
    if (!userId) {
      console.log("No user ID found in cookies or headers")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Connect to the database
    await connectToDatabase()

    // Find the user
    const user = await User.findById(userId)

    if (!user) {
      console.log("User not found with ID:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User found:", user.email)

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
    console.error("Error getting user info:", error)
    return NextResponse.json({ error: "Failed to get user information" }, { status: 500 })
  }
}

