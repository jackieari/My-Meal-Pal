"use client";

import ResultsClient from "./ResultsClient";

export default function RecipesPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b py-6">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold">Recipes</h1>
                </div>
            </header>
            <main className="container mx-auto px-4 py-12">
                <h2 className="text-4xl font-bold text-center mb-8">
                    Your Personalized Meal Suggestions
                </h2>
                <ResultsClient />
            </main>
        </div>
    );
}
