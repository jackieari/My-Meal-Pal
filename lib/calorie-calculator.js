export function calculateCalories(formData) {
    // Parse numeric values
    const currentWeight = Number.parseFloat(formData.currentWeight) || 150 // in lbs
    const goalWeight = Number.parseFloat(formData.goalWeight) || currentWeight // in lbs
    const heightFeet = Number.parseFloat(formData.heightFeet) || 5
    const heightInches = Number.parseFloat(formData.heightInches) || 6
    const totalHeightInches = heightFeet * 12 + heightInches
    const weeklyGoal = Number.parseFloat(formData.weeklyGoal) || 1
  
    // Calculate age from date of birth
    const birthDate = formData.dob ? new Date(formData.dob) : new Date("1990-01-01")
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    age = age || 30 // Default to 30 if calculation fails
  
    // Calculate BMR using the Harris-Benedict Equation
    let bmr
    if (formData.gender === "male") {
      // BMR for men: 66.5 + (13.75 × weight in kg) + (5.003 × height in cm) - (6.75 × age)
      bmr = 66.5 + 13.75 * (currentWeight / 2.205) + 5.003 * (totalHeightInches * 2.54) - 6.75 * age
    } else {
      // BMR for women: 655.1 + (9.563 × weight in kg) + (1.850 × height in cm) - (4.676 × age)
      bmr = 655.1 + 9.563 * (currentWeight / 2.205) + 1.85 * (totalHeightInches * 2.54) - 4.676 * age
    }
  
    // Apply activity multiplier
    const activityMultipliers = {
      sedentary: 1.2, // Little or no exercise
      light: 1.375, // Light exercise 1-3 days/week
      moderate: 1.55, // Moderate exercise 3-5 days/week
      very: 1.725, // Hard exercise 6-7 days/week
      extra: 1.9, // Very hard exercise & physical job or 2x training
    }
  
    const activityLevel = formData.activityLevel
    const multiplier = activityMultipliers[activityLevel] || activityMultipliers.moderate
  
    const tdee = bmr * multiplier // Total Daily Energy Expenditure
  
    // Adjust based on fitness goal
    let dailyCalories = tdee
  
    if (formData.fitnessGoal === "lose") {
      // Create a calorie deficit (3500 calories = 1 pound)
      dailyCalories = tdee - (3500 * weeklyGoal) / 7
    } else if (formData.fitnessGoal === "gain") {
      // Create a calorie surplus for weight gain
      dailyCalories = tdee + (3500 * weeklyGoal) / 7
    } else if (formData.fitnessGoal === "muscle") {
      // Smaller surplus for lean muscle gain
      dailyCalories = tdee + (2500 * weeklyGoal) / 7
    }
  
    // Ensure minimum healthy calories
    const minCalories = formData.gender === "male" ? 1500 : 1200
    dailyCalories = Math.max(dailyCalories, minCalories)
  
    // Round to nearest 10
    dailyCalories = Math.round(dailyCalories / 10) * 10
  
    // Set macronutrient ratios based on fitness goal
    let proteinPercentage, carbsPercentage, fatPercentage
  
    if (formData.fitnessGoal === "maintain") {
      // For maintenance: 55-60% carbs, 25-30% protein, 15-20% fat
      carbsPercentage = 0.575 // 57.5% (middle of 55-60%)
      proteinPercentage = 0.275 // 27.5% (middle of 25-30%)
      fatPercentage = 0.15 // 15% (lower end of 15-20%)
    } else if (formData.fitnessGoal === "lose") {
      // For weight loss: Higher protein, moderate carbs, moderate fat
      carbsPercentage = 0.45 // 45%
      proteinPercentage = 0.35 // 35%
      fatPercentage = 0.2 // 20%
    } else if (formData.fitnessGoal === "gain") {
      // For weight gain: Higher carbs, moderate protein, moderate fat
      carbsPercentage = 0.6 // 60%
      proteinPercentage = 0.25 // 25%
      fatPercentage = 0.15 // 15%
    } else if (formData.fitnessGoal === "muscle") {
      // For muscle gain: Higher protein, moderate carbs, lower fat
      carbsPercentage = 0.5 // 50%
      proteinPercentage = 0.35 // 35%
      fatPercentage = 0.15 // 15%
    }
  
    // Calculate macros based on percentages
    let protein = Math.round((dailyCalories * proteinPercentage) / 4)
    let carbs = Math.round((dailyCalories * carbsPercentage) / 4)
    let fat = Math.round((dailyCalories * fatPercentage) / 9)
  
    // Adjust protein based on body weight if needed
    // Determine which weight to use for protein calculations
    let proteinCalculationWeight = currentWeight
  
    if (formData.fitnessGoal === "lose") {
      // For weight loss, use an intermediate weight between current and goal weight
      // This prevents excessive protein for those with significant weight to lose
      const weightDifference = currentWeight - goalWeight
      if (weightDifference > 20) {
        // If there's a significant difference, use a weight closer to the goal
        proteinCalculationWeight = currentWeight - weightDifference * 0.5
      }
    } else if (formData.fitnessGoal === "muscle" || formData.fitnessGoal === "gain") {
      // For muscle gain or weight gain, use goal weight if it's higher than current
      if (goalWeight > currentWeight) {
        proteinCalculationWeight = goalWeight
      }
    }
  
    // Ensure minimum protein based on body weight
    let minProteinByWeight
    if (formData.fitnessGoal === "muscle") {
      minProteinByWeight = Math.round(proteinCalculationWeight * 0.8) // At least 0.8g/lb for muscle building
    } else if (formData.fitnessGoal === "lose") {
      minProteinByWeight = Math.round(proteinCalculationWeight * 0.7) // At least 0.7g/lb for weight loss
    } else {
      minProteinByWeight = Math.round(proteinCalculationWeight * 0.5) // At least 0.5g/lb for others
    }
  
    // Use the higher of percentage-based or weight-based protein
    if (protein < minProteinByWeight) {
      // If percentage-based protein is too low, use weight-based minimum
      const additionalProteinCalories = (minProteinByWeight - protein) * 4
      protein = minProteinByWeight
  
      // Reduce carbs and fat proportionally to maintain calorie total
      const totalNonProtein = carbsPercentage + fatPercentage
      const carbsReduction = Math.round((additionalProteinCalories * (carbsPercentage / totalNonProtein)) / 4)
      const fatReduction = Math.round((additionalProteinCalories * (fatPercentage / totalNonProtein)) / 9)
  
      carbs = Math.max(carbs - carbsReduction, 50) // Ensure minimum 50g carbs
      fat = Math.max(fat - fatReduction, 15) // Ensure minimum 15g fat
    }
  
    return {
      dailyCalories,
      bmr: Math.round(bmr),
      protein,
      carbs,
      fat,
    }
  }
  
  