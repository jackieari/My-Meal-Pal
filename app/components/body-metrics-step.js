"use client"

import { Label } from "@/app/components/ui/label"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Checkbox } from "@/app/components/ui/checkbox"

export function BodyMetricsStep({ formData, updateFormData }) {
  // Common allergens list
  const allergenOptions = [
    { id: "dairy", label: "Dairy" },
    { id: "eggs", label: "Eggs" },
    { id: "peanuts", label: "Peanuts" },
    { id: "tree-nuts", label: "Tree Nuts" },
    { id: "soy", label: "Soy" },
    { id: "wheat", label: "Wheat/Gluten" },
    { id: "fish", label: "Fish" },
    { id: "shellfish", label: "Shellfish" },
    { id: "sesame", label: "Sesame" },
  ]

  // Dietary restriction options
  const dietaryOptions = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "pescatarian", label: "Pescatarian" },
    { id: "Ketogenic", label: "Ketogenic" },
    { id: "paleo", label: "Paleo" },
    { id: "gluten-free", label: "Gluten-Free" },
  ]

  // Handle allergen selection
  const handleAllergenChange = (allergenId) => {
    const updatedAllergens = formData.allergens.includes(allergenId)
      ? formData.allergens.filter((id) => id !== allergenId)
      : [...formData.allergens, allergenId]

    updateFormData({ allergens: updatedAllergens })
  }

  // Handle dietary restriction selection
  const handleDietaryChange = (dietId) => {
    const updatedDietary = formData.dietaryRestrictions.includes(dietId)
      ? formData.dietaryRestrictions.filter((id) => id !== dietId)
      : [...formData.dietaryRestrictions, dietId]

    updateFormData({ dietaryRestrictions: updatedDietary })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-gray-700">Gender</Label>
          <Select value={formData.gender} onValueChange={(value) => updateFormData({ gender: value })}>
            <SelectTrigger id="gender" className="bg-white border-gray-300 text-gray-800">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob" className="text-gray-700">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={formData.dob}
            onChange={(e) => updateFormData({ dob: e.target.value })}
            required
            className="bg-white border-gray-300 text-gray-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="current-weight" className="text-gray-700">Current Weight (lbs)</Label>
          <Input
            id="current-weight"
            type="number"
            placeholder="150"
            value={formData.currentWeight}
            onChange={(e) => updateFormData({ currentWeight: e.target.value })}
            required
            className="bg-white border-gray-300 text-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-weight" className="text-gray-700">Goal Weight (lbs)</Label>
          <Input
            id="goal-weight"
            type="number"
            placeholder="135"
            value={formData.goalWeight}
            onChange={(e) => updateFormData({ goalWeight: e.target.value })}
            required
            className="bg-white border-gray-300 text-gray-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height-feet" className="text-gray-700">Height</Label>
          <div className="flex gap-2">
            <div className="w-1/2">
              <Select value={formData.heightFeet} onValueChange={(value) => updateFormData({ heightFeet: value })}>
                <SelectTrigger id="height-feet" className="bg-white border-gray-300 text-gray-800">
                  <SelectValue placeholder="ft" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => i + 4).map((feet) => (
                    <SelectItem key={feet} value={feet.toString()}>
                      {feet} ft
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2">
              <Select value={formData.heightInches} onValueChange={(value) => updateFormData({ heightInches: value })}>
                <SelectTrigger id="height-inches" className="bg-white border-gray-300 text-gray-800">
                  <SelectValue placeholder="in" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i).map((inches) => (
                    <SelectItem key={inches} value={inches.toString()}>
                      {inches} in
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-level" className="text-gray-700">Activity Level</Label>
          <Select value={formData.activityLevel} onValueChange={(value) => updateFormData({ activityLevel: value })}>
            <SelectTrigger id="activity-level" className="bg-white border-gray-300 text-gray-800">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentary</SelectItem>
              <SelectItem value="light">Lightly Active</SelectItem>
              <SelectItem value="moderate">Moderately Active</SelectItem>
              <SelectItem value="very">Very Active</SelectItem>
              <SelectItem value="extra">Extra Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700">Your fitness goal</Label>
        <Select
          value={formData.fitnessGoal}
          onValueChange={(value) => {
            updateFormData({
              fitnessGoal: value,
              // Reset weekly goal when changing fitness goal
              weeklyGoal: value === "lose" ? "1" : value === "gain" ? "0.5" : value === "muscle" ? "0.25" : "0",
            })
          }}
          className="bg-white border-gray-300 text-gray-800"
        >
          <SelectTrigger className="bg-white border-gray-300 text-gray-800">
            <SelectValue placeholder="Select your goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lose">Lose Weight</SelectItem>
            <SelectItem value="maintain">Maintain Weight</SelectItem>
            <SelectItem value="gain">Gain Weight</SelectItem>
            <SelectItem value="muscle">Gain Muscle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.fitnessGoal !== "maintain" && (
        <div className="space-y-2">
          <Label htmlFor="weekly-goal" className="text-gray-700">Weekly Goal</Label>
          <Select value={formData.weeklyGoal} onValueChange={(value) => updateFormData({ weeklyGoal: value })}>
            <SelectTrigger id="weekly-goal" className="bg-white border-gray-300 text-gray-800">
              <SelectValue placeholder="Select weekly goal" />
            </SelectTrigger>
            <SelectContent>
              {formData.fitnessGoal === "lose" ? (
                <>
                  <SelectItem value="0.5">Lose 0.5 lb per week</SelectItem>
                  <SelectItem value="1">Lose 1 lb per week</SelectItem>
                  <SelectItem value="1.5">Lose 1.5 lb per week</SelectItem>
                  <SelectItem value="2">Lose 2 lb per week</SelectItem>
                </>
              ) : formData.fitnessGoal === "gain" ? (
                <>
                  <SelectItem value="0.25">Gain 0.25 lb per week</SelectItem>
                  <SelectItem value="0.5">Gain 0.5 lb per week</SelectItem>
                  <SelectItem value="0.75">Gain 0.75 lb per week</SelectItem>
                  <SelectItem value="1">Gain 1 lb per week</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="0.25">Gain 0.25 lb of muscle per week</SelectItem>
                  <SelectItem value="0.5">Gain 0.5 lb of muscle per week</SelectItem>
                  <SelectItem value="0.75">Gain 0.75 lb of muscle per week</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Dietary Restrictions Section */}
      <div className="space-y-3 pt-2">
        <Label className="text-gray-700">Dietary Restrictions</Label>
        <div className="grid grid-cols-2 gap-2">
          {dietaryOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`diet-${option.id}`}
                checked={formData.dietaryRestrictions.includes(option.id)}
                onCheckedChange={() => handleDietaryChange(option.id)}
                className="border-gray-300 data-[state=checked]:bg-blue-500"
              />
              <label
                htmlFor={`diet-${option.id}`}
                className="text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Allergens Section */}
      <div className="space-y-3 pt-2">
        <Label className="text-gray-700">Food Allergens</Label>
        <div className="grid grid-cols-2 gap-2">
          {allergenOptions.map((allergen) => (
            <div key={allergen.id} className="flex items-center space-x-2">
              <Checkbox
                id={`allergen-${allergen.id}`}
                checked={formData.allergens.includes(allergen.id)}
                onCheckedChange={() => handleAllergenChange(allergen.id)}
                className="border-gray-300 data-[state=checked]:bg-blue-500"
              />
              <label
                htmlFor={`allergen-${allergen.id}`}
                className="text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {allergen.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}