import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export async function POST(req) {
  try {
    await connectToDatabase();

    const { email, password } = await req.json();
    
    console.log(" Received Login Request for:", email); // Debug log

    const user = await User.findOne({ email });

    if (!user) {
      console.error("User not found for email:", email);
      return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });
    }

    console.log("User Found:", user); // Debug log

    if (!user.passwordHash) {
      console.error("passwordHash is missing in user document:", user);
      return NextResponse.json({ message: "Server error: Password field missing" }, { status: 500 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      console.error(" Password mismatch for user:", email);
      return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });
    }

    const token = createToken(user);
    const response = NextResponse.json({ message: "Login successful", user }, { status: 200 });

    response.cookies.set("access-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    console.log("Login Successful for:", email);
    return response;
  } catch (error) {
    console.error("Login Error:", error.message);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
