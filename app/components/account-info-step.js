"use client"

import Link from "next/link"
import { Facebook, Mail } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Checkbox } from "@/app/components/ui/checkbox"

export function AccountInfoStep({ formData, updateFormData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="w-full bg-gray-700 hover:bg-gray-600 text-white">
          <Facebook className="mr-2 h-4 w-4 text-blue-400" />
          Facebook
        </Button>
        <Button variant="outline" className="w-full bg-gray-700 hover:bg-gray-600 text-white">
          <Mail className="mr-2 h-4 w-4" />
          Google
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-800 px-2 text-gray-400">Or sign up with email</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Full Name
        </Label>
        <Input
          id="name"
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          required
          className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          required
          className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData({ password: e.target.value })}
          required
          className="bg-gray-700 text-white border-gray-600 focus:border-blue-500"
        />
        <p className="text-xs text-gray-400">Password must be at least 8 characters long</p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="terms" required className="border-gray-500 data-[state=checked]:bg-blue-500" />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none text-gray-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I agree to the{" "}
          <Link href="#" className="text-blue-400 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-blue-400 hover:underline">
            Privacy Policy
          </Link>
        </label>
      </div>
    </div>
  )
}

