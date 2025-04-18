'use client';
import { useEffect, useState } from 'react';

export default function MealPlanPage() {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/meal-plan');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setPlan(data.plan);
      } catch (e) { setError(e.message); }
    })();
  }, []);

  if (error)  return <p className="p-4 text-red-600">Error: {error}</p>;
  if (!plan)  return <p className="p-4 text-gray-500">Loading plan…</p>;
  if (!plan.length)
    return <p className="p-4 text-gray-500">No plan saved yet.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Weekly Meal Plan</h1>

      <ul className="space-y-6">
        {plan.map(d => (
          <li key={d.day}>
            <h2 className="font-semibold text-lg mb-2">{d.day}</h2>
            <ul className="space-y-2">
              {d.meals.map(m => (
                <li
                  key={m.id}
                  className="border rounded-lg p-3 flex gap-3 items-center"
                >
                  <img src={m.image} className="w-16 h-16 object-cover rounded" />
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-gray-600">
                      {m.macros.calories} Cal · {m.macros.protein} P ·
                      {m.macros.carbs} C · {m.macros.fat} F
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
