"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Calendar,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Check,
  ChevronLeft,
} from "lucide-react"

export default function Page() {
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const [openDay, setOpenDay] = useState(null)
  const [loading, setLoading] = useState(false)
  const [swapOptions, setSwapOptions] = useState({
    isOpen: false,
    day: null,
    mealId: null,
    options: [],
  })

  /* ---------- helpers ---------- */
  /**
   * Aggregate identical meals so repeated recipes are shown once with a servings badge.
   * @param {Array} meals
   * @returns {Array} with added `servings` property
   */
  const aggregateMeals = (meals) => {
    const map = {}
    meals.forEach((m) => {
      const key = m.id || m.title
      if (!map[key]) {
        map[key] = { ...m, servings: 1 }
      } else {
        map[key].servings += 1
      }
    })
    return Object.values(map)
  }

  // Toggle function to open/close a day
  const toggleDay = (day) => {
    setOpenDay((prev) => (prev === day ? null : day))
  }

  // Fetch meal plan data
  const fetchMealPlan = async () => {
    try {
      const res = await fetch("/api/meal-plan")
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setPlan(data.plan)

      // Automatically open the first day when data loads
      if (data.plan && data.plan.length > 0 && !openDay) {
        setOpenDay(data.plan[0].day)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  // Fetch swap options
  const fetchSwapOptions = async (day, mealId) => {
    setLoading(true)
    try {
      const res = await fetch("/api/meal-plan/swap-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, mealId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to get meal options")
      setSwapOptions({ isOpen: true, day, mealId, options: data.options || [] })
    } catch (e) {
      setError(e.message || "Error getting meal options")
      // demo fallback
      setSwapOptions({ isOpen: true, day, mealId, options: generateFallbackOptions() })
    } finally {
      setLoading(false)
    }
  }

  // Fallback options (demo)
  const generateFallbackOptions = () => [
    {
      id: "option1",
      title: "Grilled Chicken Salad",
      image: "/placeholder.svg?height=200&width=300",
      macros: { calories: 350, protein: 30, carbs: 15, fat: 18 },
    },
    {
      id: "option2",
      title: "Vegetable Stir Fry",
      image: "/placeholder.svg?height=200&width=300",
      macros: { calories: 280, protein: 12, carbs: 40, fat: 8 },
    },
    {
      id: "option3",
      title: "Salmon with Roasted Vegetables",
      image: "/placeholder.svg?height=200&width=300",
      macros: { calories: 420, protein: 35, carbs: 20, fat: 22 },
    },
  ]

  // Confirm swap
  const confirmSwap = async (optionId) => {
    setLoading(true)
    try {
      const res = await fetch("/api/meal-plan/confirm-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: swapOptions.day, mealId: swapOptions.mealId, optionId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to swap meal")
      setPlan(data.plan)
      closeSwapOptions()
    } catch (e) {
      setError(e.message || "Error swapping meal")
      simulateSuccessfulSwap(optionId) // demo
    } finally {
      setLoading(false)
    }
  }

  // Demo swap
  const simulateSuccessfulSwap = (optionId) => {
    if (!plan) return
    const selected = swapOptions.options.find((o) => o.id === optionId)
    if (!selected) return
    const newPlan = plan.map((day) => {
      if (day.day !== swapOptions.day) return day
      const meals = day.meals.map((m) => (m.id === swapOptions.mealId ? { ...selected, id: selected.id } : m))
      return { ...day, meals }
    })
    setPlan(newPlan)
    closeSwapOptions()
  }

  const closeSwapOptions = () => setSwapOptions({ isOpen: false, day: null, mealId: null, options: [] })

  useEffect(() => {
    fetchMealPlan()
  }, [])

  /* ---------- UI states (error, loading, empty) ---------- */
  if (error)
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
          <div className="shrink-0 bg-red-100 dark:bg-red-900/40 p-2 rounded-full">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <p>Error: {error}</p>
        </div>
      </div>
    )

  if (!plan)
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-gray-900 dark:text-white">
          <Calendar className="h-7 w-7 text-blue-700 dark:text-blue-500" />
          <span>Weekly Meal Plan</span>
        </h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map((idx) => (
            <div key={idx} className="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    )

  if (!plan.length)
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 text-center">
        <div className="py-12 px-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 inline-flex rounded-full p-4 mb-4">
            <Calendar className="h-8 w-8 text-blue-700 dark:text-blue-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">No meal plan yet</h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            You haven't created a meal plan yet. Start planning your meals for a healthier week ahead.
          </p>
        </div>
      </div>
    )

  /* ---------- MAIN RENDER ---------- */
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      {/* back link */}
      <div className="py-4 px-6">
        <Link href="/home" className="inline-flex items-center text-blue-600 hover:underline">
          <ChevronLeft className="mr-1 h-5 w-5" /> Back to Home
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Calendar className="h-7 w-7 text-blue-700 dark:text-blue-500" />
          <span>Weekly Meal Plan</span>
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mt-2">Click on a day to view meals</p>
      </header>

      <div className="space-y-4">
        {plan.map((d) => {
          const meals = aggregateMeals(d.meals) // *** aggregated ***
          return (
            <div key={d.day} className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
              {/* Day button */}
              <button
                onClick={() => toggleDay(d.day)}
                className={`w-full p-4 text-left font-medium flex items-center justify-between transition-colors ${
                  openDay === d.day
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                }`}
              >
                <span className="text-lg">{d.day}</span>
                {openDay === d.day ? (
                  <ChevronUp className="h-5 w-5 text-blue-700 dark:text-blue-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                )}
              </button>

              {/* Meal list */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openDay === d.day ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
                  {meals.map((m) => (
                    <div key={m.id || m.title} className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden transition-all hover:shadow-md">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-24 sm:h-24 h-40 relative">
                          <img src={m.image || "/placeholder.svg"} alt={m.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-lg text-gray-900 dark:text-white">{m.title}</h3>
                              {m.servings > 1 && (
                                <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200">
                                  x{m.servings}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                fetchSwapOptions(d.day, m.id)
                              }}
                              disabled={loading}
                              className={`ml-2 p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors ${
                                loading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              title="Swap for another meal"
                            >
                              <RefreshCw className={`h-4 w-4 ${loading && swapOptions.mealId === m.id ? "animate-spin" : ""}`} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {m.macros.calories} Cal
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                              {m.macros.protein}g Protein
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {m.macros.carbs}g Carbs
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                              {m.macros.fat}g Fat
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ---------- Swap modal ---------- */}
      {swapOptions.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Choose a replacement meal</h3>
              <button onClick={closeSwapOptions} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                {swapOptions.options.map((o) => (
                  <div
                    key={o.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => confirmSwap(o.id)}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-32 sm:h-32 h-48 relative">
                        <img src={o.image || "/placeholder.svg"} alt={o.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-lg text-gray-900 dark:text-white">{o.title}</h4>
                          <button
                            className="ml-2 p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            onClick={(e) => {
                              e.stopPropagation()
                              confirmSwap(o.id)
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {o.macros.calories} Cal
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                            {o.macros.protein}g Protein
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {o.macros.carbs}g Carbs
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                            {o.macros.fat}g Fat
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={closeSwapOptions} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
