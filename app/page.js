"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Camera, Menu, X, Zap } from "lucide-react"
import foodImg from "./assets/food.jpg"

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleLogin = () => {
    router.push("/login")
  }

  const handleSignup = () => {
    router.push("/register")
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Navigation */}
      <header
        className={`sticky top-0 z-40 w-full border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 ${
          scrollY > 50 ? "shadow-lg" : "shadow-md"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-700 dark:text-blue-500" />
                <span className="font-bold text-xl">MyMealPal</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="#features"
                className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400"
              >
                How It Works
              </a>
              <button
                onClick={handleLogin}
                className="px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400"
              >
                Login
              </button>
              <button
                onClick={handleSignup}
                className="inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Sign Up
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950/90 md:hidden">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white dark:bg-gray-900 shadow-lg p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-700 dark:text-blue-500" />
                <span className="font-bold text-xl">MealPal</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="rounded-md p-1 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col space-y-6">
              <a
                href="#features"
                className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogin()
                }}
                className="flex items-center gap-3 text-base font-medium text-gray-800 dark:text-gray-200"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleSignup()
                }}
                className="flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-base font-medium text-white shadow hover:bg-blue-800"
              >
                Sign Up
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
        <div className="container mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Plan Your Meals with Simplicity
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
              MealPal helps you create personalized meal plans based on your dietary preferences, what's in your fridge,
              and your nutritional goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSignup}
                className="inline-flex items-center justify-center rounded-md bg-blue-700 px-6 py-3 text-lg font-medium text-white shadow-sm hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Get Started
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-800 px-6 py-3 text-lg font-medium text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Learn More
              </a>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative h-64 md:h-96 w-full rounded-xl overflow-hidden shadow-xl border border-gray-300 dark:border-gray-700">
              <Image
                src={foodImg} 
                alt="Meal planning made easy"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-100 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Why Choose MealPal?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-300 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-700 dark:text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Smart Meal Planning</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Create weekly meal plans based on your dietary preferences, restrictions, and calorie goals.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-300 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-blue-700 dark:text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Fridge Scan Technology</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Take a photo of your fridge contents and get recipe suggestions based on what you already have.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-300 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-blue-700 dark:text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Nutrition Tracking</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Monitor your calorie intake, macronutrients, and overall nutritional balance with detailed insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-16 bg-white dark:bg-gray-900 border-y border-gray-300 dark:border-gray-700"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-700 dark:text-blue-500">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Sign Up</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Create your account and set your dietary preferences and goals.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-700 dark:text-blue-500">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Scan Your Fridge</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Take a photo of your fridge contents to get personalized recipe suggestions.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-700 dark:text-blue-500">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Plan Your Meals</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Create a weekly meal plan based on your preferences and available ingredients.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-700 dark:text-blue-500">4</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Track & Adjust</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Monitor your nutrition and adjust your meal plans as needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-700 dark:bg-blue-800">
        <div className="container mx-auto px-4 text-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-white">Ready to Transform Your Meal Planning?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
              Join thousands of users who have simplified their meal planning and improved their nutrition with MealPal.
            </p>
            <button
              onClick={handleSignup}
              className="px-8 py-4 bg-white text-blue-700 rounded-lg hover:bg-gray-100 text-lg font-bold inline-block shadow-md"
            >
              Sign Up Now - It's Free!
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 py-12 border-t border-gray-300 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-6 w-6 text-blue-700 dark:text-blue-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">MealPal</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Intelligent meal planning for a healthier, simpler life.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Features</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    Meal Planning
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    Fridge Scan
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    Nutrition Tracking
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    Recipe Database
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} MealPal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
