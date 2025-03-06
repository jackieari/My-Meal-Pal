import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { validateToken } from "@/lib/auth"; // Import validateToken

export async function GET(req) {
  try {
    // Use validateToken to verify the JWT token
    const decoded = validateToken(req);
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user by the decoded user ID from the token
    const user = await User.findById(decoded._id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return the user data (or you can send specific fields like name)
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}