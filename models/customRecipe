import mongoose from "mongoose";

const CustomRecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    ingredients: { type: [String], required: true },
    bio: { type: String },
    instructions: { type: String, required: true },
    prepTime: { type: String },
    userEmail: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.CustomRecipe ||
  mongoose.model("CustomRecipe", CustomRecipeSchema);