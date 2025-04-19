"use client"

import Link from "next/link"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Checkbox } from "@/app/components/ui/checkbox"

export function AccountInfoStep({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Full Name
        </Label>
        <Input
          id="name"
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          required
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          required
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData({ password: e.target.value })}
          required
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 dark:focus:ring-blue-500 focus:border-blue-700 dark:focus:border-blue-500"
        />
        <p className="text-xs text-gray-600 dark:text-gray-400">Password must be at least 8 characters long</p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="terms"
          required
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-700 dark:text-blue-500 focus:ring-blue-700 dark:focus:ring-blue-500"
        />
        <label htmlFor="terms" className="text-sm font-medium text-gray-800 dark:text-gray-200">
          I agree to the{" "}
          <Link href="#" className="text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-blue-700 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400">
            Privacy Policy
          </Link>
        </label>
      </div>
    </div>
  )
}
