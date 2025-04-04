import Image from "next/image";
import Link from "next/link";

export default function RecipeList({ recipes = [] }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
                <div key={recipe.id} className="bg-white text-black rounded-lg shadow-md overflow-hidden">
                    <Link href={recipe.url || "#"} passHref>
                        <div className="relative w-full h-48 cursor-pointer">
                            <Image
                                src={recipe.image || "/placeholder.svg"}
                                alt={recipe.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </Link>
                    <div className="p-4">
                        <h3 className="text-lg font-semibold">{recipe.title}</h3>
                        <p className="text-sm text-gray-600">
                            {recipe.usedIngredientCount} used / {recipe.missedIngredientCount} missing
                        </p>

                        {/* Display Ingredients Used */}
                        {recipe.usedIngredients && recipe.usedIngredients.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-lg font-medium">Ingredients:</h4>
                                <ul className="list-disc pl-6 space-y-2 mt-2 text-gray-800">
                                    {recipe.usedIngredients.map((ingredient, index) => (
                                        <li key={index}>{ingredient.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Display Calories */}
                        {recipe.calories && (
                            <p className="text-sm text-green-700 mt-2">
                                <strong>Calories:</strong> {recipe.calories}
                            </p>
                        )}

                        {/* Display Basic Nutrition Info */}
                        {recipe.nutrition && recipe.nutrition.length > 0 && (
                            <div className="mt-2 text-sm text-gray-700">
                                <p className="font-medium mb-1">Nutrition:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    {recipe.nutrition
                                        .filter(n => ["Fat", "Carbohydrates", "Protein"].includes(n.name))
                                        .map((nutrient) => (
                                            <li key={nutrient.name}>
                                                {nutrient.name}: {nutrient.amount}
                                                {nutrient.unit}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}