"use client"

import { Progress } from "@/app/components/ui/progress"
import { Card, CardContent } from "@/app/components/ui/card"

export function CalorieResultsStep({ calorieData, formData }) {
  const { dailyCalories, protein, carbs, fat } = calorieData
  const currentWeight = Number.parseFloat(formData.currentWeight) || 150
  const goalWeight = Number.parseFloat(formData.goalWeight) || currentWeight

  // Calculate percentages for the progress bars
  const proteinCalories = protein * 4
  const carbsCalories = carbs * 4
  const fatCalories = fat * 9
  const totalCalories = proteinCalories + carbsCalories + fatCalories

  const proteinPercent = Math.round((proteinCalories / totalCalories) * 100)
  const carbsPercent = Math.round((carbsCalories / totalCalories) * 100)
  const fatPercent = Math.round((fatCalories / totalCalories) * 100)

  // Calculate protein per pound
  const proteinPerPound = (protein / currentWeight).toFixed(1)

  // Calculate weight difference for display
  const weightDifference = Math.abs(currentWeight - goalWeight)
  const isWeightLoss = currentWeight > goalWeight
  const isWeightGain = goalWeight > currentWeight

  // Get macronutrient ratio descriptions
  const getMacroRatioDescription = () => {
    if (formData.fitnessGoal === "maintain") {
      return "balanced macronutrient ratio with higher carbohydrates (55-60%), moderate protein (25-30%), and lower fat (15-20%)"
    } else if (formData.fitnessGoal === "lose") {
      return "higher protein ratio to preserve muscle mass, with moderate carbohydrates and fat"
    } else if (formData.fitnessGoal === "gain") {
      return "higher carbohydrate ratio to fuel energy needs, with moderate protein and lower fat"
    } else if (formData.fitnessGoal === "muscle") {
      return "higher protein ratio to support muscle growth, with moderate carbohydrates and lower fat"
    }
  }

  // Format dietary restrictions and allergens for display
  const formatListItems = (items) => {
    if (!items || items.length === 0) return "None"

    // Convert from IDs to readable labels
    const labelMap = {
      // Dietary restrictions
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      pescatarian: "Pescatarian",
      keto: "Keto",
      paleo: "Paleo",
      "gluten-free": "Gluten-Free",
      "dairy-free": "Dairy-Free",
      "low-carb": "Low Carb",

      // Allergens
      dairy: "Dairy",
      eggs: "Eggs",
      peanuts: "Peanuts",
      "tree-nuts": "Tree Nuts",
      soy: "Soy",
      wheat: "Wheat/Gluten",
      fish: "Fish",
      shellfish: "Shellfish",
      sesame: "Sesame",
    }

    return items.map((item) => labelMap[item] || item).join(", ")
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">
          {formData.name ? formData.name.split(" ")[0] + ", here's" : "Here's"} your personalized plan
        </h3>
        <p className="text-muted-foreground">
          Based on your goals and body metrics, we've calculated your daily calorie target
        </p>
        <p className="text-xs text-blue-600">
          This calorie target will be saved to your profile when you complete signup
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-8 border-blue-100">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{dailyCalories}</div>
            <div className="text-sm text-muted-foreground">DAILY CALORIES</div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium">Recommended Daily Macros</h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Carbohydrates</span>
                  <span className="font-medium">
                    {carbs}g ({carbsPercent}%)
                  </span>
                </div>
                <Progress value={carbsPercent} className="h-2 bg-gray-100" indicatorClassName="bg-blue-500" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Protein</span>
                  <span className="font-medium">
                    {protein}g ({proteinPercent}%) - {proteinPerPound}g/lb
                  </span>
                </div>
                <Progress value={proteinPercent} className="h-2 bg-gray-100" indicatorClassName="bg-red-500" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Fat</span>
                  <span className="font-medium">
                    {fat}g ({fatPercent}%)
                  </span>
                </div>
                <Progress value={fatPercent} className="h-2 bg-gray-100" indicatorClassName="bg-yellow-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Preferences Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium">Your Dietary Preferences</h4>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium">Dietary Restrictions:</span>
                <p className="text-sm">{formatListItems(formData.dietaryRestrictions)}</p>
              </div>

              <div>
                <span className="text-sm font-medium">Food Allergens:</span>
                <p className="text-sm">{formatListItems(formData.allergens)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg text-sm">
        <h4 className="font-medium mb-2">How we calculated your nutrition plan:</h4>
        <p>
          We used your age, gender, height, weight, and activity level to calculate your daily calorie needs.
          {weightDifference > 0 && (
            <span>
              {" "}
              Your goal to {isWeightLoss ? "lose" : "gain"} {weightDifference.toFixed(1)} lbs
              {formData.fitnessGoal !== "maintain" ? ` at a rate of ${formData.weeklyGoal} lb per week` : ""}
              was factored into your calorie target.
            </span>
          )}
        </p>
        <p className="mt-2">
          For your{" "}
          {formData.fitnessGoal === "maintain"
            ? "weight maintenance"
            : formData.fitnessGoal === "lose"
              ? "weight loss"
              : formData.fitnessGoal === "gain"
                ? "weight gain"
                : "muscle building"}{" "}
          goal, we recommend a {getMacroRatioDescription()}.
          {isWeightLoss &&
            formData.fitnessGoal === "lose" &&
            weightDifference > 20 &&
            " We've adjusted your protein needs based on your goal weight to provide optimal nutrition throughout your weight loss journey."}
        </p>
      </div>
    </div>
  )
}

