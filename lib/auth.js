import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const createToken = (user) => {
  return jwt.sign(
    { email: user.email, _id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export const validateToken = async (req) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access-token");

  if (!token) return null;

  try {
    return jwt.verify(token.value, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};