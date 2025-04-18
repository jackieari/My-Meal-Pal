// File: /app/api/user/liked-recipes/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectToDatabase } from "@/lib/mongodb";
import UserLike from "@/models/UserLike";
import User from "@/models/User";

/* ---------- config ---------- */

// ❗ put your actual key below
const SPOONACULAR_KEY = "9b7d827bda4b4594ac9518c5f8d0a47c";

/* ---------- helpers ---------- */

async function getAuthenticatedUser() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie?.value) return null;

  const userId = sessionCookie.value.split("_")[0];
  await connectToDatabase();
  return await User.findById(userId);
}

function chunk(arr, size = 100) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* ---------- GET  /api/user/liked-recipes ---------- */

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const likes = await UserLike.find({ userId: user._id }).lean();
    if (likes.length === 0) {
      return NextResponse.json({ success: true, recipes: [] });
    }

    const recipeIds = likes.map(l => l.recipeId);
    const recipes = [];

    for (const ids of chunk(recipeIds, 100)) {
      const url =
        `https://api.spoonacular.com/recipes/informationBulk` +
        `?ids=${ids.join(",")}` +
        `&includeNutrition=true` +
        `&apiKey=${SPOONACULAR_KEY}`;

      const resp = await fetch(url);
      if (!resp.ok) {
        console.error("Spoonacular error", await resp.text());
        return NextResponse.json(
          { success: false, error: "Failed to fetch recipe details" },
          { status: 502 }
        );
      }
      recipes.push(...(await resp.json()));
    }

    return NextResponse.json({ success: true, recipes });
  } catch (err) {
    console.error("liked‑recipes route error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
