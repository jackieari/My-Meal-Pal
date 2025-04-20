"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, Calendar, Loader2 } from "lucide-react"

/* Extract a rounded nutrient value from Spoonacular data */
function macro(recipe, name) {
  const n = recipe.nutrition?.nutrients?.find((x) => x.name === name)
  return n ? `${Math.round(n.amount)}${n.unit}` : "–"
}

export default function LikedRecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [picked, setPicked] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  /* load liked recipes  */
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/liked-recipes") // adjust if your URL differs
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setRecipes(data.recipes)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  /* ---------- create plan ---------- */
  async function createPlan() {
    if (creating) return

    const chosen = recipes.filter((r) => picked.has(r.id))
    if (!chosen.length) return // nothing selected

    setCreating(true)

    try {
      const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri","Sat","Sun"]

      const days = weekdays.map((day) => ({
        day,
        meals: chosen.map((r) => ({
          id: r.id,
          title: r.title,
          image: r.image,
          macros: {
            calories: macro(r, "Calories"),
            protein: macro(r, "Protein"),
            carbs: macro(r, "Carbohydrates"),
            fat: macro(r, "Fat"),
          },
        })),
      }))

      await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })

      router.push("/meal-plan")
    } catch (err) {
      setError(err.message)
      setCreating(false)
    }
  }

  /* ---------- early states ---------- */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full border-4 border-t-blue-700 dark:border-t-blue-500 border-gray-200 dark:border-gray-700 animate-spin"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Loading your liked recipes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          Error: {error}
        </div>
      </div>
    )
  }

  if (!recipes.length) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 text-center">
        <div className="py-12 px-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 inline-flex rounded-full p-4 mb-4">
            <Heart className="h-8 w-8 text-blue-700 dark:text-blue-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">No liked recipes yet</h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            You haven't liked any recipes yet. Browse recipes and click the heart icon to save them here.
          </p>
        </div>
      </div>
    )
  }

  /* ---------- UI ---------- */
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
        <Heart className="h-6 w-6 text-blue-700 dark:text-blue-500" />
        Your Liked Recipes
      </h1>

      {/* top controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {picked.size === 0 ? "Select recipes to create a meal plan" : `Selected ${picked.size} recipes`}
        </span>
        <button
          disabled={picked.size === 0 || creating}
          onClick={createPlan}
          className="px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:text-gray-200 dark:disabled:text-gray-500 flex items-center gap-2 transition-colors"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              Create Mon–Sun Plan
            </>
          )}
        </button>
      </div>

      {/* recipe card grid */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((r) => (
          <li
            key={r.id}
            className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative">
              <img
                src={r.image ?? `https://spoonacular.com/recipeImages/${r.id}-556x370.jpg`}
                alt={r.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white text-sm font-medium hover:underline"
                >
                  View Recipe
                </a>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{r.title}</h2>

              {/* Nutrition info */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {macro(r, "Calories")} cal
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                  {macro(r, "Protein")} protein
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {macro(r, "Carbohydrates")} carbs
                </span>
              </div>

              {/* select checkbox */}
              <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 mt-2">
                <input
                  type="checkbox"
                  checked={picked.has(r.id)}
                  onChange={(e) => {
                    setPicked((prev) => {
                      const s = new Set(prev)
                      e.target.checked ? s.add(r.id) : s.delete(r.id)
                      return s
                    })
                  }}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-700 dark:text-blue-500 focus:ring-blue-700 dark:focus:ring-blue-500"
                />
                Add to meal plan
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
