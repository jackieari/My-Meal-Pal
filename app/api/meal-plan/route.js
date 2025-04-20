// File: /app/api/meal-plan/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectToDatabase } from "@/lib/mongodb";
import MealPlan from "@/models/MealPlan";
import User from "@/models/User";

/* ---------- helper: current user ---------- */
async function getUser() {
  const raw = cookies().get("session")?.value;
  if (!raw) return null;
  await connectToDatabase();
  return User.findById(raw.split("_")[0]);
}

/* ---------- GET  /api/meal-plan ---------- */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not auth" }, { status: 401 });
  }

  const plan = await MealPlan.findOne({ userId: user._id }).lean();
  return NextResponse.json({ success: true, plan: plan?.days ?? [] });
}

/* ---------- POST  /api/meal-plan ----------
   Body: { days: [ { day:"Mon", meals:[ ... ] }, ... ] }
   Requirement: 5 days, each with ≥1 meal.
------------------------------------------- */
export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not auth" }, { status: 401 });
  }

  const { days } = await request.json();

  const valid =
    Array.isArray(days) &&
    days.length === 7 &&
    days.every(d => Array.isArray(d.meals) && d.meals.length >= 1);

  if (!valid) {
    return NextResponse.json(
      { error: "Need 7 days and at least one meal per day" },
      { status: 400 }
    );
  }

  await MealPlan.findOneAndUpdate(
    { userId: user._id },
    { days },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true });
}
