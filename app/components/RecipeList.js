
import Image from "next/image";

export default function RecipeList({ recipes = [] }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
                <div key={recipe.id} className="bg-white text-black rounded-lg shadow-md overflow-hidden">
                    <div className="relative w-full h-48">
                        <Image
                            src={recipe.image || "/placeholder.svg"}
                            alt={recipe.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="p-4">
                        <h3 className="text-lg font-semibold">{recipe.title}</h3>
                        <p className="text-sm text-gray-600">
                            {recipe.usedIngredientCount} used / {recipe.missedIngredientCount} missing
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}


