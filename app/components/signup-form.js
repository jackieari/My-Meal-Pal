"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Zap } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { AccountInfoStep } from "@/app/components/account-info-step"
import { BodyMetricsStep } from "@/app/components/body-metrics-step"
import { CalorieResultsStep } from "@/app/components/calorie-results-step"
import { calculateCalories } from "@/lib/calorie-calculator"

export function SignupForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    // User account info
    name: "",
    email: "",
    password: "",

    // Body metrics
    gender: "female",
    dob: "",
    currentWeight: "",
    goalWeight: "",
    heightFeet: "5",
    heightInches: "6",
    activityLevel: "moderate",
    fitnessGoal: "lose",
    weeklyGoal: "1",

    // Nutritional preferences
    dietaryRestrictions: [],
    allergens: [],
    calorieLimit: null,
  })

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Calculate the latest calorie data and use it for calorieLimit
      const calorieData = calculateCalories(formData)

      // Format data according to your API requirements
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        // Include additional nutritional data
        nutritionalPreferences: {
          dietaryRestrictions: formData.dietaryRestrictions,
          calorieLimit: calorieData.dailyCalories,
          allergens: formData.allergens,
        },
      }

      // Send registration data to the API using your existing endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        // Redirect to login page after successful registration
        router.push("/login")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Registration failed")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate calories when needed for the results step
  const calorieData = calculateCalories(formData)

  // Determine if we're in review mode (Step 3) or confirm account creation mode (Step 4)
  const isReviewStep = currentStep === 3
  const isConfirmStep = currentStep === 4

  return (
    <Card className="w-full shadow-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="h-6 w-6 text-blue-700 dark:text-blue-500" />
            <span className="text-blue-700 dark:text-blue-500">MyMealPal</span>
          </div>
        </div>
        <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">Create your account</CardTitle>
        <CardDescription className="text-center text-gray-700 dark:text-gray-300">
          {currentStep === 1
            ? "First, let's create your account"
            : currentStep === 2
              ? "Now, tell us about yourself"
              : currentStep === 3
                ? "Review your personalized plan"
                : "Confirm account creation"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 ? (
            <AccountInfoStep formData={formData} updateFormData={updateFormData} />
          ) : currentStep === 2 ? (
            <BodyMetricsStep formData={formData} updateFormData={updateFormData} />
          ) : isReviewStep || isConfirmStep ? (
            <>
              <CalorieResultsStep calorieData={calorieData} formData={formData} />

              {isConfirmStep && (
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-500 mb-2">
                    Ready to create your account?
                  </h3>
                  <p className="text-gray-800 dark:text-gray-200">
                    We'll set up your account with the information provided above. You can always update your
                    preferences later.
                  </p>
                </div>
              )}
            </>
          ) : null}

          {error && <div className="text-red-600 dark:text-red-400 text-sm text-center">{error}</div>}

          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                className="ml-auto bg-blue-700 hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                onClick={handleNext}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : isReviewStep ? (
              <Button
                type="button"
                className="ml-auto bg-blue-700 hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                onClick={handleNext}
              >
                Looks Good
                <Check className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="ml-auto bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create My Account"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400">
            Log in
          </Link>
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700"
          >
            Home
          </Link>
          <Link
            href="/profile"
            className="px-4 py-2 bg-blue-700 dark:bg-blue-500 text-white rounded hover:bg-blue-800 dark:hover:bg-blue-600"
          >
            Profile
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
