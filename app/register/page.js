"use client"
import { SignupForm } from "@/app/components/signup-form"

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6">
        <SignupForm />
      </div>
    </div>
  )
}

