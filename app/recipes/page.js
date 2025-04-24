"use client";

import Link from "next/link";
import ResultsClient from "./ResultsClient";

export default function RecipesPage() {
    return (
        <>
            <div className="py-4 px-6">
                <Link href="/home">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-md shadow hover:bg-blue-50 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                        </svg>
                        <span className="font-medium">Back to Home</span>
                    </button>
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