import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import UserLike from "@/models/UserLike"

async function getUser() {
  const raw = cookies().get("session")?.value
  if (!raw) return null
  await connectToDatabase()
  return User.findById(raw.split("_")[0])
}

function chunk(arr, size = 100) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function POST(request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { day, mealId } = await request.json()
  await connectToDatabase()

  try {
    // Get all of the user's liked recipes
    const likes = await UserLike.find({ userId: user._id }).lean()

    // If user has no liked recipes, fall back to random recipes
    if (!likes || likes.length === 0) {
      return await getRandomRecipes()
    }

    // Get all recipe IDs from likes
    const recipeIds = likes.map((like) => like.recipeId)
    const recipes = []

    // Fetch details for all liked recipes in chunks to avoid API limits
    const apiKey = process.env.SPOONACULAR_API_KEY || "f1baf1b23e83419c93a5fe9784633292"
    // Process recipe IDs in chunks of 100 (Spoonacular's limit for bulk requests)
    for (const ids of chunk(recipeIds, 100)) {
      const url = `https://api.spoonacular.com/recipes/informationBulk?ids=${ids.join(",")}&includeNutrition=true&apiKey=${apiKey}`

      const response = await fetch(url)
      if (!response.ok) {
        console.error("Spoonacular error", await response.text())
        continue // Skip this chunk if there's an error, but try the next one
      }

      const chunkRecipes = await response.json()
      recipes.push(...chunkRecipes)
    }

    // If we couldn't fetch any recipes, fall back to random recipes
    if (recipes.length === 0) {
      return await getRandomRecipes()
    }

    // Format the recipes to match your meal schema
    const options = recipes.map(formatRecipe)

    return NextResponse.json({
      success: true,
      options,
      source: "liked",
      count: options.length,
    })
  } catch (error) {
    console.error("Error fetching liked recipes:", error)
    // If anything goes wrong, fall back to random recipes
    return await getRandomRecipes()
  }
}

// Helper function to get random recipes as fallback
async function getRandomRecipes() {
  const apiKey = process.env.SPOONACULAR_API_KEY || "6f3e35ad7c004cc28796a5e46e86931f"
  const spoonRes = await fetch(
    `https://api.spoonacular.com/recipes/random?number=3&apiKey=${apiKey}&addRecipeNutrition=true`,
  )

  if (!spoonRes.ok) {
    return NextResponse.json({ success: false, error: "Failed to fetch recipes" }, { status: 502 })
  }

  const { recipes } = await spoonRes.json()
  const options = recipes.map(formatRecipe)

  return NextResponse.json({
    success: true,
    options,
    source: "random", // Indicate these are random recipes, not liked ones
    count: options.length,
  })
}

// Helper function to format recipe data
function formatRecipe(recipe) {
  // Find nutrition data - handle different possible formats from Spoonacular
  let calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0

  if (recipe.nutrition && recipe.nutrition.nutrients) {
    // Direct nutrients array
    calories = Math.round(recipe.nutrition.nutrients.find((n) => n.name === "Calories")?.amount || 0)
    protein = Math.round(recipe.nutrition.nutrients.find((n) => n.name === "Protein")?.amount || 0)
    carbs = Math.round(recipe.nutrition.nutrients.find((n) => n.name === "Carbohydrates")?.amount || 0)
    fat = Math.round(recipe.nutrition.nutrients.find((n) => n.name === "Fat")?.amount || 0)
  } else if (recipe.nutritionWidget && recipe.nutritionWidget.nutrients) {
    // Alternative format
    calories = Math.round(recipe.nutritionWidget.nutrients.find((n) => n.name === "Calories")?.amount || 0)
    protein = Math.round(recipe.nutritionWidget.nutrients.find((n) => n.name === "Protein")?.amount || 0)
    carbs = Math.round(recipe.nutritionWidget.nutrients.find((n) => n.name === "Carbohydrates")?.amount || 0)
    fat = Math.round(recipe.nutritionWidget.nutrients.find((n) => n.name === "Fat")?.amount || 0)
  }

  // If we still don't have nutrition data, provide default values
  if (calories === 0) {
    calories = Math.floor(Math.random() * 400) + 200 // Random between 200-600
    protein = Math.floor(Math.random() * 30) + 10 // Random between 10-40
    carbs = Math.floor(Math.random() * 40) + 20 // Random between 20-60
    fat = Math.floor(Math.random() * 20) + 5 // Random between 5-25
  }

  return {
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    macros: {
      calories,
      protein,
      carbs,
      fat,
    },
    liked: true, // Mark these as liked recipes
  }
}
