// models/UserLike.js
import mongoose from "mongoose";

const UserLikeSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    recipeId: { 
      type: String, 
      required: true 
    }
  },
  { timestamps: true }
);

// Create a compound index to ensure a user can only like a recipe once
UserLikeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

export default mongoose.models.UserLike || mongoose.model("UserLike", UserLikeSchema);