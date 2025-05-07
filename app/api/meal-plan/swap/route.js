import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import MealPlan from "@/models/MealPlan"
import User from "@/models/User"

async function getUser() {
  const raw = cookies().get("session")?.value
  if (!raw) return null
  await connectToDatabase()
  return User.findById(raw.split("_")[0])
}

export async function POST(request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { day, mealId } = await request.json()
  await connectToDatabase()

  // Load existing plan
  const planDoc = await MealPlan.findOne({ userId: user._id })
  if (!planDoc) {
    return NextResponse.json({ error: "No meal plan found" }, { status: 404 })
  }

  // Locate the correct day and meal index
  const dayIdx = planDoc.days.findIndex((d) => d.day === day)
  if (dayIdx < 0) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 })
  }
  const mealIdx = planDoc.days[dayIdx].meals.findIndex((m) => m.id === mealId)
  if (mealIdx < 0) {
    return NextResponse.json({ error: "Invalid meal ID" }, { status: 400 })
  }

  // Fetch one random recipe from Spoonacular
  const apiKey = "ef6f679c81d24beb857ec331b318f1f3";
  const spoonRes = await fetch(
    `https://api.spoonacular.com/recipes/random?number=1&apiKey=${apiKey}`
  )
  const { recipes } = await spoonRes.json()
  const r = recipes[0]

  // Build replacement meal shape to match your stored schema
  const newMeal = {
    id: r.id,
    title: r.title,
    image: r.image,
    macros: {
      calories: Math.round(r.nutrition.nutrients.find((n) => n.name === "Calories")?.amount ?? 0),
      protein: Math.round(r.nutrition.nutrients.find((n) => n.name === "Protein")?.amount ?? 0),
      carbs:    Math.round(r.nutrition.nutrients.find((n) => n.name === "Carbohydrates")?.amount ?? 0),
      fat:      Math.round(r.nutrition.nutrients.find((n) => n.name === "Fat")?.amount ?? 0),
    },
  }

  // Replace only that one meal
  planDoc.days[dayIdx].meals[mealIdx] = newMeal
  await planDoc.save()

  return NextResponse.json({ success: true, plan: planDoc.days })
}
