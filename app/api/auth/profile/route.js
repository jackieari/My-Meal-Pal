// File: app/api/profile/route.js
import { NextResponse }      from "next/server";
import { cookies }           from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { calculateCalories } from "@/lib/calorie-calculator";   // ← add
import User                  from "@/models/User";

/* ---------- auth helper ---------- */
async function getAuthenticatedUser() {
  const session = cookies().get("session")?.value;
  if (!session) return null;
  const userId = session.split("_")[0];
  await connectToDatabase();
  return User.findById(userId);
}

/* ---------- GET ---------- */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      nutritionalPreferences: user.nutritionalPreferences,
      bodyMetrics: user.bodyMetrics
    }
  });
}

/* ---------- PUT ---------- */
export async function PUT(request) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { name, nutritionalPreferences, bodyMetrics } = await request.json();

  /* --- name --- */
  if (name) user.name = name;

  /* --- nutritional prefs (dietaryRestrictions/allergens/calLimit) --- */
  if (nutritionalPreferences) {
    for (const key of ["dietaryRestrictions", "allergens", "calorieLimit"])
      if (nutritionalPreferences[key] !== undefined)
        user.nutritionalPreferences[key] = nutritionalPreferences[key];
  }

  /* --- body metrics + auto-recalc calories/macros --- */
  if (bodyMetrics && typeof bodyMetrics === "object") {
    Object.assign(user.bodyMetrics, bodyMetrics);

    // Only recalc if we have enough info (your calculateCalories helper may
    // already handle defaults/NaN checks—adjust if needed)
    const { dailyCalories, protein, carbs, fat } =
      calculateCalories(user.bodyMetrics);

    user.nutritionalPreferences.calorieLimit = dailyCalories;
    user.nutritionalPreferences.macros = { protein, carbs, fat };
  }

  await user.save();

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      nutritionalPreferences: user.nutritionalPreferences,
      bodyMetrics: user.bodyMetrics
    }
  });
}

/* ---------- DELETE (unchanged) ---------- */
export async function DELETE() { /* ... */ }
