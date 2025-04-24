"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Heart,
  Calendar,
  Wand2,
  Loader2,
} from "lucide-react";

/* ──────────── helper functions ──────────── */
const macro = (r, name) =>
  Math.round(r.nutrition?.nutrients?.find((n) => n.name === name)?.amount ?? 0);

const label   = (v, u) => `${v}${u}`;
const shuffle = (a)   => a.sort(() => Math.random() - 0.5);
const err     = (tot, goal) =>
  ["calories", "protein", "carbs", "fat"].reduce(
    (s, k) => s + Math.abs(tot[k] - goal[k]) / goal[k],
    0
  );

/*  Tailwind’s JIT compiler only keeps explicit class names,            */
/*  so we map the `color` prop to real classes it can see.              */
const COLOR_MAP = {
  blue    : "bg-blue-600  hover:bg-blue-700",
  emerald : "bg-emerald-600 hover:bg-emerald-700",
  gray    : "bg-gray-600  hover:bg-gray-700",
};

/* ─────────── reusable little UI pieces ─────────── */
const Btn = ({ children, onClick, disabled, icon, color = "blue" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-2 rounded-md text-white transition-colors
                disabled:bg-gray-400 ${COLOR_MAP[color] ?? COLOR_MAP.blue}`}
  >
    {icon}
    {children}
  </button>
);

const Badge = ({ children }) => (
  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800
                   dark:bg-blue-900/30 dark:text-blue-300
                   border border-blue-200 dark:border-blue-800">
    {children}
  </span>
);

const Center = ({ children, error }) => (
  <section
    className={`flex flex-col items-center justify-center min-h-[300px] p-8 ${
      error ? "text-red-600 dark:text-red-400" : ""
    }`}
  >
    {children}
  </section>
);

/* ────────────────────────────────────────────────── */
export default function LikedRecipesPage() {
  const [recipes, setRecipes]   = useState([]);
  const [picked,  setPicked]    = useState(new Set());
  const [goals,   setGoals]     = useState(null);
  const [busy,    setBusy]      = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  const router = useRouter();

  /* -------- fetch liked recipes & daily macro goals -------- */
  useEffect(() => {
    (async () => {
      try {
        const [rLiked, rGoals] = await Promise.all([
          fetch("/api/liked-recipes"),
          fetch("/api/users/goals"),
        ]);
        if (!rLiked.ok) throw new Error(await rLiked.text());
        if (!rGoals.ok) throw new Error(await rGoals.text());

        const liked = await rLiked.json();
        const g     = await rGoals.json();

        if (!liked.success) throw new Error(liked.error);

        setRecipes(liked.recipes);
        setGoals({
          calories : Math.round(g.calorieLimit),
          protein  : Math.round(g.macros.protein),
          carbs    : Math.round(g.macros.carbs),
          fat      : Math.round(g.macros.fat),
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------- save a week-plan to Mongo ---------------- */
  async function savePlan(meals) {
    const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      meals: meals.map((m) => ({
        id    : m.id,
        title : m.title,
        image : m.image,
        macros: {
          calories: label(macro(m, "Calories"),       " cal"),
          protein : label(macro(m, "Protein"),        " g"),
          carbs   : label(macro(m, "Carbohydrates"),  " g"),
          fat     : label(macro(m, "Fat"),            " g"),
        },
      })),
    }));

    await fetch("/api/meal-plan", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ days: week }),
    });
  }

  /* -------------- auto-generator algorithm ---------------- */
  function autoGenerate(pool, goal) {
    /* decorate with numeric macros for quick maths */
    const decorated = shuffle(pool).map((r) => ({
      ...r,
      nums: {
        calories: macro(r, "Calories"),
        protein : macro(r, "Protein"),
        carbs   : macro(r, "Carbohydrates"),
        fat     : macro(r, "Fat"),
      },
    }));

    const chosen  = [];
    const totals  = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const used    = new Map();          // recipeId → servings
    const maxServ = 3;
    const steps   = [0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50];

    const needMoreCalories = () => totals.calories < goal.calories * 0.95;
    const fits = (obj, cap) =>
      ["calories", "protein", "carbs", "fat"].every(
        (k) => totals[k] + obj.nums[k] <= goal[k] * (1 + cap)
      );

    /* Pass 1: unique recipes only */
    for (const cap of steps) {
      let added = true;
      while (added && needMoreCalories()) {
        added = false;
        const cand = decorated.find((r) => !used.has(r.id) && fits(r, cap));
        if (cand) {
          pick(cand);
          added = true;
        }
      }
      if (!needMoreCalories()) break;
    }

    /* Pass 2: allow duplicates up to maxServ each */
    for (const cap of steps) {
      let added = true;
      while (added && needMoreCalories()) {
        added = false;
        const cand = decorated
          .filter((r) => (used.get(r.id) || 0) < maxServ)
          .sort((a, b) => b.nums.calories - a.nums.calories)
          .find((r) => fits(r, cap));

        if (cand) {
          pick(cand);
          added = true;
        }
      }
      if (!needMoreCalories()) break;
    }

    /* Pass 3: small swaps to minimise macro error        */
    refine(chosen, decorated, totals, goal, used, maxServ);
    return chosen;

    /* helper: pick/record one serving of a recipe */
    function pick(rec) {
      chosen.push(rec);
      Object.keys(totals).forEach((k) => (totals[k] += rec.nums[k]));
      used.set(rec.id, (used.get(rec.id) || 0) + 1);
    }
  }

  /* ---------- simple local swap-refinement ---------- */
  function refine(chosen, pool, totals, goal, used, maxServ) {
    const MAX = 40,
          CAP = 0.5;  // never exceed 150 % of any macro

    for (let i = 0; i < MAX; i++) {
      let bestGain = 0,
          repIdx   = -1,
          repCand  = null;

      chosen.forEach((sel, idx) => {
        pool.forEach((cand) => {
          if (cand.id === sel.id && (used.get(cand.id) || 0) >= maxServ) return;

          const newTotals = {
            calories: totals.calories - sel.nums.calories + cand.nums.calories,
            protein : totals.protein  - sel.nums.protein  + cand.nums.protein,
            carbs   : totals.carbs    - sel.nums.carbs    + cand.nums.carbs,
            fat     : totals.fat      - sel.nums.fat      + cand.nums.fat,
          };
          const bust = Object.keys(newTotals).some(
            (k) => newTotals[k] > goal[k] * (1 + CAP)
          );
          if (bust) return;

          const gain = err(totals, goal) - err(newTotals, goal);
          if (gain > bestGain + 1e-6) {
            bestGain = gain;
            repIdx   = idx;
            repCand  = cand;
          }
        });
      });

      if (bestGain <= 0) break;           // nothing better
      const out = chosen[repIdx];

      used.set(out.id,        used.get(out.id) - 1);
      used.set(repCand.id,   (used.get(repCand.id) || 0) + 1);
      Object.keys(totals).forEach(
        (k) => (totals[k] += repCand.nums[k] - out.nums[k])
      );
      chosen[repIdx] = repCand;
    }
  }

  /* ---------------- button actions ------------------ */
  const createAutoPlan = async () => {
    if (busy || !goals) return;
    setBusy(true);
    try {
      const meals = autoGenerate(recipes, goals);
      if (!meals.length)
        throw new Error("Your liked recipes can’t satisfy those targets.");
      await savePlan(meals);
      router.push("/meal-plan");
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const createSelectedPlan = async () => {
    if (busy || picked.size === 0) return;
    setBusy(true);
    try {
      await savePlan(recipes.filter((r) => picked.has(r.id)));
      router.push("/meal-plan");
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  /* ---------------- render -------------------------- */
  if (loading)
    return (
      <Center>
        <Loader2 className="h-10 w-10 animate-spin" />
      </Center>
    );

  if (error)
    return (
      <Center error>
        <p>{error}</p>
      </Center>
    );

  if (!recipes.length)
    return (
      <Center>
        <Heart className="h-10 w-10 text-blue-600 mb-3" />
        <p>No liked recipes yet.</p>
      </Center>
    );

  return (
    <>
      {/* Back link */}
      <div className="py-4 px-6">
        <Link
            href="/home"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-400 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg shadow-sm transition-all hover:shadow"
        >
          <ChevronLeft className="h-5 w-5"/>
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Page title */}
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6 text-blue-700"/>
          Your Liked Recipes
        </h1>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-900
                        border rounded-lg">
          <span className="text-sm">
            {picked.size
              ? `${picked.size} selected`
              : "Tick recipes for manual plan"}
          </span>

          <Btn
            onClick={createSelectedPlan}
            disabled={busy || picked.size === 0}
            icon={
              busy && picked.size ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )
            }
          >
            Create Plan (Selected)
          </Btn>

          <Btn
            color="emerald"
            onClick={createAutoPlan}
            disabled={busy}
            icon={
              busy && !picked.size ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )
            }
          >
            Auto-Generate Plan
          </Btn>
        </div>

        {/* Recipe grid */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r) => (
            <li
              key={r.id}
              className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md"
            >
              <img
                src={
                  r.image ??
                  `https://spoonacular.com/recipeImages/${r.id}-636x393.jpg`
                }
                alt={r.title}
                className="w-full h-48 object-cover"
              />

              <div className="p-4 flex flex-col gap-3">
                <h2 className="text-lg font-semibold">{r.title}</h2>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge>{label(macro(r, "Calories"), " cal")}</Badge>
                  <Badge>{label(macro(r, "Protein"), " g")} protein</Badge>
                  <Badge>{label(macro(r, "Carbohydrates"), " g")} carbs</Badge>
                  <Badge>{label(macro(r, "Fat"), " g")} fat</Badge>
                </div>

                <label className="flex items-center gap-2 text-sm mt-2">
                  <input
                    type="checkbox"
                    checked={picked.has(r.id)}
                    onChange={(e) =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        e.target.checked ? next.add(r.id) : next.delete(r.id);
                        return next;
                      })
                    }
                  />
                  Select for manual plan
                </label>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
