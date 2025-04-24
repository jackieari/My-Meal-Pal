"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Zap } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/app/components/ui/card"

import { AccountInfoStep } from "@/app/components/account-info-step"
import { BodyMetricsStep } from "@/app/components/body-metrics-step"
import { CalorieResultsStep } from "@/app/components/calorie-results-step"

import { calculateCalories } from "@/lib/calorie-calculator"

export function SignupForm() {
  const router = useRouter()

  /* ---------- local state ---------- */
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    /* account info */
    name: "",
    email: "",
    password: "",

    /* body metrics (all strings -> easy HTML binding) */
    gender: "female",
    dob: "",
    currentWeight: "",
    goalWeight: "",
    heightFeet: "5",
    heightInches: "6",
    activityLevel: "moderate",
    fitnessGoal: "lose",
    weeklyGoal: "1",

    /* nutritional prefs */
    dietaryRestrictions: [],
    allergens: []
  })

  /* ---------- helpers ---------- */
  const updateFormData = (data) =>
    setFormData((prev) => ({ ...prev, ...data }))

  const handleNext = () => setCurrentStep((s) => s + 1)
  const handleBack = () => setCurrentStep((s) => s - 1)

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      /* 1️⃣  compute calories/macros from filled-in metrics */
      const { dailyCalories, protein, carbs, fat } = calculateCalories(formData)

      /* 2️⃣  assemble bodyMetrics exactly like the schema */
      const bodyMetrics = {
        gender:        formData.gender,
        dob:           formData.dob,
        currentWeight: formData.currentWeight,
        goalWeight:    formData.goalWeight,
        heightFeet:    formData.heightFeet,
        heightInches:  formData.heightInches,
        activityLevel: formData.activityLevel,
        fitnessGoal:   formData.fitnessGoal,
        weeklyGoal:    formData.weeklyGoal
      }

      /* 3️⃣  payload for /api/auth/register */
      const userData = {
        name:     formData.name,
        email:    formData.email,
        password: formData.password,

        bodyMetrics,
        nutritionalPreferences: {
          dietaryRestrictions: formData.dietaryRestrictions,
          allergens:           formData.allergens,
          calorieLimit:        dailyCalories,
          macros: { protein, carbs, fat }
        }
      }

      const res = await fetch("/api/auth/register", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(userData)
      })

      if (res.ok) {
        router.push("/login")
      } else {
        const { error: msg = "Registration failed" } = await res.json()
        setError(msg)
      }
    } catch (err) {
      console.error("Error submitting form:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  /* ---------- derived ---------- */
  const calorieData   = calculateCalories(formData)
  const isReviewStep  = currentStep === 3
  const isConfirmStep = currentStep === 4

  /* ---------- JSX ---------- */
  return (
    <Card className="w-full shadow-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="h-6 w-6 text-blue-700 dark:text-blue-500" />
            <span className="text-blue-700 dark:text-blue-500">MyMealPal</span>
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Create your account</CardTitle>
        <CardDescription className="text-center">
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
          {currentStep === 1 && (
            <AccountInfoStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <BodyMetricsStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {(isReviewStep || isConfirmStep) && (
            <>
              <CalorieResultsStep
                calorieData={calorieData}
                formData={formData}
              />

              {isConfirmStep && (
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-blue-700 dark:text-blue-500 mb-2">
                    Ready to create your account?
                  </h3>
                  <p>
                    We'll set up your account with the information provided
                    above. You can always update your preferences later.
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="bg-white dark:bg-gray-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            {currentStep < 3 && (
              <Button
                type="button"
                onClick={handleNext}
                className="ml-auto bg-blue-700 hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {isReviewStep && (
              <Button
                type="button"
                onClick={handleNext}
                className="ml-auto bg-blue-700 hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                Looks Good
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}

            {isConfirmStep && (
              <Button
                type="submit"
                disabled={isLoading}
                className="ml-auto bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
              >
                {isLoading ? "Creating account…" : "Create My Account"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <p className="text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-700 dark:text-blue-500 hover:underline"
          >
            Log in
          </Link>
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700"
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
