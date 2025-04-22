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

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get user's dietary preferences
    const { dietaryRestrictions = [], allergens = [], calorieLimit = 2000 } = user.nutritionalPreferences || {}

    // Format dietary restrictions for Spoonacular API
    const diet = dietaryRestrictions.length > 0 ? dietaryRestrictions[0].toLowerCase() : ""

    // Format allergens for Spoonacular API (comma-separated)
    const intolerances = allergens.join(",")

    // Build query parameters
    const params = new URLSearchParams({
      apiKey: "6f3e35ad7c004cc28796a5e46e86931f",
      number: "2", // Number of recipes to return
      addRecipeInformation: "true",
      fillIngredients: "true",
    })

    // Add diet if available
    if (diet) params.append("diet", diet)

    // Add intolerances if available
    if (intolerances) params.append("intolerances", intolerances)

    // Add max calories if available
    if (calorieLimit) params.append("maxCalories", calorieLimit.toString())

    // Call Spoonacular API
    const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`)

    if (!response.ok) {
      console.error("Spoonacular API error:", await response.text())
      return NextResponse.json({ error: "Failed to fetch recipe suggestions" }, { status: 502 })
    }

    const data = await response.json()

    // Format the response
    const suggestions = data.results.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      calories: recipe.nutrition?.nutrients?.find((n) => n.name === "Calories")?.amount || 0,
      protein: recipe.nutrition?.nutrients?.find((n) => n.name === "Protein")?.amount || 0,
      carbs: recipe.nutrition?.nutrients?.find((n) => n.name === "Carbohydrates")?.amount || 0,
      fat: recipe.nutrition?.nutrients?.find((n) => n.name === "Fat")?.amount || 0,
      matchedDietaryRestrictions: dietaryRestrictions.filter((r) =>
        recipe.diets?.some((d) => d.toLowerCase().includes(r.toLowerCase())),
      ),
      matchedAllergens: allergens.filter(
        (a) => !recipe.extendedIngredients?.some((i) => i.name.toLowerCase().includes(a.toLowerCase())),
      ),
    }))

    return NextResponse.json({ success: true, suggestions })
  } catch (error) {
    console.error("Error fetching recipe suggestions:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
