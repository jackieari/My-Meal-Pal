// scripts/backfillMacros.js
import mongoose from "mongoose";
import { connectToDatabase } from "../lib/mongodb.js";       // → up one level into lib
import { calculateCalories }  from "../lib/calorie-calculator.js";
import User from "../models/User.js";

async function backfill() {
  await connectToDatabase();
  console.log("✔ Connected to database");

  const users = await User.find({});
  console.log(`🔄 Found ${users.length} users — backfilling macros…`);

  for (const u of users) {
    const { dailyCalories, protein, carbs, fat } = calculateCalories(u.bodyMetrics);

    u.nutritionalPreferences.calorieLimit = dailyCalories;
    u.nutritionalPreferences.macros       = { protein, carbs, fat };

    await u.save();
    console.log(`  ✅ Updated ${u.email}`);
  }

  console.log("🎉 All users updated!");
  process.exit(0);
}

backfill().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
