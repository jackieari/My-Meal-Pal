
export default function IngredientsList({ ingredients = [] }) {
    return (
        <div className="flex flex-wrap gap-4">
            {ingredients.length > 0 ? (
                ingredients.map((ingredient, idx) => (
                    <div key={idx} className="bg-gray-200 p-2 rounded">
                        {ingredient}
                    </div>
                ))
            ) : (
                <p>No ingredients detected.</p>
            )}
        </div>
    );
}


