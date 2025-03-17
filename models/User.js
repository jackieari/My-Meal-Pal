
// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    nutritionalPreferences: {
      dietaryRestrictions: { type: [String], default: [] },
      allergens: { type: [String], default: [] },
      calorieLimit: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);