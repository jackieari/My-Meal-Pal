// File: app/api/users/route.js
import { NextResponse }      from "next/server";
import bcrypt                from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { calculateCalories } from "@/lib/calorie-calculator";   // ← now imported
import User                  from "@/models/User";

export async function POST(request) {
  try {
    await connectToDatabase();

    const {
      name,
      email,
      password,
      nutritionalPreferences = {},
      bodyMetrics = null      // ← allow metrics on signup
    } = await request.json();

    /* ---------- validation & duplicate check ---------- */
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    if (await User.findOne({ email })) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    /* ---------- hash password ---------- */
    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));

    /* ---------- build prefs (+ auto-calculated macros) ---------- */
    const prefs = {
      dietaryRestrictions: nutritionalPreferences.dietaryRestrictions || [],
      allergens:            nutritionalPreferences.allergens            || [],
      calorieLimit:         nutritionalPreferences.calorieLimit         ?? null,
      macros: {
        protein: nutritionalPreferences.macros?.protein ?? 0,
        carbs:   nutritionalPreferences.macros?.carbs   ?? 0,
        fat:     nutritionalPreferences.macros?.fat     ?? 0,
      },
    };

    if (bodyMetrics && typeof bodyMetrics === "object") {
      const { dailyCalories, protein, carbs, fat } = calculateCalories(bodyMetrics);
      prefs.calorieLimit = dailyCalories;
      prefs.macros       = { protein, carbs, fat };
    }

    /* ---------- create & save user ---------- */
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      nutritionalPreferences: prefs,
      bodyMetrics: bodyMetrics || {},
    });

    /* ---------- response ---------- */
    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id        : newUser._id.toString(),
          name      : newUser.name,
          email     : newUser.email,
          nutritionalPreferences: newUser.nutritionalPreferences,
          bodyMetrics           : newUser.bodyMetrics,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
