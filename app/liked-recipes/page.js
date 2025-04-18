'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* Extract a rounded nutrient value from Spoonacular data */
function macro(recipe, name) {
  const n = recipe.nutrition?.nutrients?.find(x => x.name === name);
  return n ? `${Math.round(n.amount)}${n.unit}` : '–';
}

export default function LikedRecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [picked,   setPicked] = useState(new Set());
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);
  const router = useRouter();

  /* load liked recipes  */
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

  /* ---------- create plan ---------- */
  async function createPlan() {
    const chosen = recipes.filter(r => picked.has(r.id));
    if (!chosen.length) return;               // nothing selected

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    const days = weekdays.map(day => ({
      day,
      meals: chosen.map(r => ({
        id:    r.id,
        title: r.title,
        image: r.image,
        macros: {
          calories: macro(r, 'Calories'),
          protein:  macro(r, 'Protein'),
          carbs:    macro(r, 'Carbohydrates'),
          fat:      macro(r, 'Fat'),
        },
      })),
    }));

    await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    });

    router.push('/meal-plan');
  }

  /* ---------- early states ---------- */
  if (loading) return <p className="p-4 text-gray-500">Loading…</p>;
  if (error)   return <p className="p-4 text-red-600">Error: {error}</p>;
  if (!recipes.length)
    return <p className="p-4 text-gray-500">You haven’t liked any recipes yet.</p>;

  /* ---------- UI ---------- */
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Liked Recipes</h1>

      {/* top controls */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm">Selected {picked.size}</span>
        <button
          disabled={picked.size === 0}
          onClick={createPlan}
          className="px-3 py-1 rounded bg-blue-600 text-white disabled:bg-gray-400"
        >
          Create Mon–Fri Plan
        </button>
      </div>

      {/* recipe card grid */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(r => (
          <li
            key={r.id}
            className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md"
          >
            <img
              src={r.image ?? `https://spoonacular.com/recipeImages/${r.id}-556x370.jpg`}
              alt={r.title}
              className="w-full h-40 object-cover"
            />

            <div className="p-4 flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{r.title}</h2>

              {/* select checkbox */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={picked.has(r.id)}
                  onChange={e => {
                    setPicked(prev => {
                      const s = new Set(prev);
                      e.target.checked ? s.add(r.id) : s.delete(r.id);
                      return s;
                    });
                  }}
                />
                Select
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
