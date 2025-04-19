"use client"

import { useEffect, useState } from "react"
import { Calendar, UtensilsCrossed, ChevronDown, ChevronUp } from "lucide-react"

export default function MealPlanPage() {
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const [openDay, setOpenDay] = useState(null)

  // Toggle function to open/close a day
  const toggleDay = (day) => {
    if (openDay === day) {
      setOpenDay(null) // Close if already open
    } else {
      setOpenDay(day) // Open the clicked day
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/meal-plan")
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setPlan(data.plan)

        // Automatically open the first day when data loads
        if (data.plan && data.plan.length > 0) {
          setOpenDay(data.plan[0].day)
        }
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [])

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
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div key={day} className="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
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

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Calendar className="h-7 w-7 text-blue-700 dark:text-blue-500" />
          <span>Weekly Meal Plan</span>
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mt-2">Click on a day to view meals</p>
      </header>

      <div className="space-y-4">
        {plan.map((d) => (
          <div
            key={d.day}
            className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
          >
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

            {/* Meals container with animation */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openDay === d.day ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
                {d.meals.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-24 sm:h-24 h-40 relative">
                        <img src={m.image || "/placeholder.svg"} alt={m.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">{m.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {m.macros.calories}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                            {m.macros.protein} Protein
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {m.macros.carbs} Carbs
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                            {m.macros.fat} Fat
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
