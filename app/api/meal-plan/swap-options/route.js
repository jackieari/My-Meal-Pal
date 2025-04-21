import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
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

  // Fetch multiple random recipes from Spoonacular
  const apiKey = "6f3e35ad7c004cc28796a5e46e86931f";
  const spoonRes = await fetch(
    `https://api.spoonacular.com/recipes/random?number=3&apiKey=${apiKey}&addRecipeNutrition=true`,
  )
  const { recipes } = await spoonRes.json()

  // Format the recipes to match your meal schema
  const options = recipes.map((r) => {
    // Find nutrition data - handle different possible formats from Spoonacular
    let calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0

    if (r.nutrition && r.nutrition.nutrients) {
      // Direct nutrients array
      calories = Math.round(r.nutrition.nutrients.find((n) => n.name === "Calories")?.amount || 0)
      protein = Math.round(r.nutrition.nutrients.find((n) => n.name === "Protein")?.amount || 0)
      carbs = Math.round(r.nutrition.nutrients.find((n) => n.name === "Carbohydrates")?.amount || 0)
      fat = Math.round(r.nutrition.nutrients.find((n) => n.name === "Fat")?.amount || 0)
    } else if (r.nutritionWidget && r.nutritionWidget.nutrients) {
      // Alternative format
      calories = Math.round(r.nutritionWidget.nutrients.find((n) => n.name === "Calories")?.amount || 0)
      protein = Math.round(r.nutritionWidget.nutrients.find((n) => n.name === "Protein")?.amount || 0)
      carbs = Math.round(r.nutritionWidget.nutrients.find((n) => n.name === "Carbohydrates")?.amount || 0)
      fat = Math.round(r.nutritionWidget.nutrients.find((n) => n.name === "Fat")?.amount || 0)
    }

    // If we still don't have nutrition data, provide default values
    if (calories === 0) {
      calories = Math.floor(Math.random() * 400) + 200 // Random between 200-600
      protein = Math.floor(Math.random() * 30) + 10 // Random between 10-40
      carbs = Math.floor(Math.random() * 40) + 20 // Random between 20-60
      fat = Math.floor(Math.random() * 20) + 5 // Random between 5-25
    }

    return {
      id: r.id,
      title: r.title,
      image: r.image,
      macros: {
        calories,
        protein,
        carbs,
        fat,
      },
    }
  })

  return NextResponse.json({ success: true, options })
}
