"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
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
  const isReviewStep = currentStep === 3;
  const isConfirmStep = currentStep === 4;

  return (
    <Card className="w-full shadow-lg bg-gray-800 text-white">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="text-2xl font-bold text-blue-400">MyMealPal</div>
        </div>
        <CardTitle className="text-2xl text-center">Create your account</CardTitle>
        <CardDescription className="text-center text-gray-400">
          {currentStep === 1
            ? "First, let's create your account"
            : currentStep === 2
              ? "Now, tell us about yourself"
              : currentStep === 3
                ? "Review your personalized plan"
                : "Confirm account creation"}
        </CardDescription>

        {/* Step indicator */}
        <div className="flex items-center justify-center mt-4">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 1 ? "bg-blue-500 text-white" : "bg-gray-700 text-blue-400"
              }`}
            >
              1
            </div>
            <div className="w-10 h-1 bg-gray-700">
              <div className={`h-full ${currentStep > 1 ? "bg-blue-500" : "bg-gray-700"}`}></div>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 2
                  ? "bg-blue-500 text-white"
                  : currentStep > 2
                    ? "bg-gray-700 text-blue-400"
                    : "bg-gray-700 text-gray-500"
              }`}
            >
              2
            </div>
            <div className="w-10 h-1 bg-gray-700">
              <div className={`h-full ${currentStep > 2 ? "bg-blue-500" : "bg-gray-700"}`}></div>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 3
                  ? "bg-blue-500 text-white"
                  : currentStep > 3
                    ? "bg-gray-700 text-blue-400"
                    : "bg-gray-700 text-gray-500"
              }`}
            >
              3
            </div>
            <div className="w-10 h-1 bg-gray-700">
              <div className={`h-full ${currentStep > 3 ? "bg-blue-500" : "bg-gray-700"}`}></div>
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 4 ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-500"
              }`}
            >
              4
            </div>
          </div>
        </div>
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
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-400 mb-2">Ready to create your account?</h3>
                  <p className="text-gray-300">
                    We'll set up your account with the information provided above. You can always update your preferences later.
                  </p>
                </div>
              )}
            </>
          ) : null}

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 text-white"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            {currentStep < 3 ? (
              <Button 
                type="button" 
                className="ml-auto bg-blue-500 hover:bg-blue-600" 
                onClick={handleNext}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : isReviewStep ? (
              <Button 
                type="button" 
                className="ml-auto bg-blue-500 hover:bg-blue-600"
                onClick={handleNext}
              >
                Looks Good
                <Check className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="ml-auto bg-green-600 hover:bg-green-700" 
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create My Account"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <p className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/" className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
            Home
          </Link>
          <Link href="/profile" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            Profile
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}