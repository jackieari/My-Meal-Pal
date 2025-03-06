import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true }, // Store hashed password
    nutritionalPreferences: {
      dietaryRestrictions: { type: [String], default: [] }, // e.g., ["vegan", "gluten-free"]
      calorieLimit: { type: Number, default: null },
      allergens: { type: [String], default: [] }, // e.g., ["peanuts", "dairy"]
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);