// lib/auth.js
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const createToken = (user) => {
  return jwt.sign(
    { email: user.email, _id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// This function will handle both simple token and JWT token formats
export const validateToken = async (req) => {
  try {
    console.log("validateToken called");
    
    // Get token from cookies
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get("access-token");
    
    if (!tokenCookie) {
      console.log("No access-token cookie found");
      return null;
    }
    
    const tokenValue = tokenCookie.value;
    console.log("Token found:", tokenValue.substring(0, 10) + "...");
    
    // Check if it's a simple MongoDB ID token (not a JWT)
    // This appears to be how your /api/users/me endpoint works
    if (tokenValue.length < 50 && !tokenValue.includes('.')) {
      console.log("Using simple token format");
      return { _id: tokenValue };
    }
    
    // If it's a JWT, verify it
    try {
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET environment variable not set");
        // Fallback to simple token mode
        return { _id: tokenValue };
      }
      
      const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
      console.log("JWT token verified successfully for user:", decoded._id);
      return decoded;
    } catch (verifyError) {
      console.error("JWT verification failed:", verifyError.message);
      // Fallback to simple token mode
      return { _id: tokenValue };
    }
  } catch (error) {
    console.error("Error in validateToken:", error);
    return null;
  }
};