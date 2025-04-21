"use client";

import Link from "next/link";

import ResultsClient from "./ResultsClient";

export default function RecipesPage() {
    return (
        <>
            <div className="py-4 px-6">
                <Link href="/home" className="text-blue-600 hover:underline">
                    ← Back to Home
                </Link>
            </div>
            <div className="min-h-screen bg-gray-50">
                <header className="border-b py-6 bg-white shadow-sm">
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-12">
                    <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
                        Your Personalized Meal Suggestions
                    </h2>
                    <ResultsClient />
                </main>
            </div>
        </>
    );
}