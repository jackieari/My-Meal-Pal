'use client';

import { useEffect, useState } from 'react';

/* ---------- tiny helper ---------- */
function getMacro(recipe, nutrientName) {
  const n = recipe.nutrition?.nutrients?.find(
    (x) => x.name === nutrientName
  );
  return n ? `${Math.round(n.amount)}${n.unit}` : '–';
}

export default function LikedRecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/liked-recipes');   // adjust if your URL differs
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setRecipes(data.recipes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="p-4 text-gray-500">Loading…</p>;
  if (error)   return <p className="p-4 text-red-600">Error: {error}</p>;
  if (!recipes.length)
    return <p className="p-4 text-gray-500">No liked recipes yet.</p>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Liked Recipes</h1>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((r) => (
          <li
            key={r.id}
            className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <img
              src={
                r.image ??
                `https://spoonacular.com/recipeImages/${r.id}-556x370.jpg`
              }
              alt={r.title}
              className="w-full h-40 object-cover"
            />

            <div className="p-4 flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{r.title}</h2>

              {/* ---- macros ---- */}
              <div className="grid grid-cols-2 text-sm gap-x-4 gap-y-1 mt-2">
                <span className="font-medium">Calories:</span>
                <span>{getMacro(r, 'Calories')}</span>

                <span className="font-medium">Protein:</span>
                <span>{getMacro(r, 'Protein')}</span>

                <span className="font-medium">Carbs:</span>
                <span>{getMacro(r, 'Carbohydrates')}</span>

                <span className="font-medium">Fat:</span>
                <span>{getMacro(r, 'Fat')}</span>
              </div>

              {/* optional: link to recipe */}
              <a
                href={`https://spoonacular.com/recipes/${r.title
                  .replace(/[^a-zA-Z0-9]+/g, '-')
                  .toLowerCase()}-${r.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-xs mt-3"
              >
                View on Spoonacular →
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
