import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    nutritionalPreferences: {
      dietaryRestrictions: { type: [String], default: [] },
      allergens:            { type: [String], default: [] },
      calorieLimit:         { type: Number,    default: null },
      macros: {
        protein: { type: Number, default: 0 },
        carbs:   { type: Number, default: 0 },
        fat:     { type: Number, default: 0 },
      },
    },

    bodyMetrics: {
      gender:        { type: String, default: "female" },
      dob:           { type: String, default: "" },
      currentWeight: { type: String, default: "" },
      goalWeight:    { type: String, default: "" },
      heightFeet:    { type: String, default: "5" },
      heightInches:  { type: String, default: "6" },
      activityLevel: { type: String, default: "moderate" },
      fitnessGoal:   { type: String, default: "lose" },
      weeklyGoal:    { type: String, default: "1" },
    },

  },
  { timestamps: true }
);

// Virtual for likes
UserSchema.virtual('likedRecipes', {
  ref: 'UserLike',
  localField: '_id',
  foreignField: 'userId'
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
