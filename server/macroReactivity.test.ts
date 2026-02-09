import { describe, it, expect } from "vitest";

/**
 * Test suite for macro reactivity logic
 * Validates the two scenarios:
 * A: User changes calories → recalculate all macros with default distribution (30% protein, 40% carbs, 30% fat)
 * B: User changes a specific macro → keep calories fixed, redistribute other macros proportionally
 */

interface FormData {
  dailyCalorieGoal: string;
  dailyProteinGoal: string;
  dailyCarbsGoal: string;
  dailyFatGoal: string;
}

// Simulate the recalcMacros function from ProfileSettings
function recalcMacros(data: FormData, editedField: string): FormData {
  const cal = Number(data.dailyCalorieGoal);
  const prot = Number(data.dailyProteinGoal);
  const carbs = Number(data.dailyCarbsGoal);
  const fat = Number(data.dailyFatGoal);

  if (!cal || cal <= 0) {
    return data;
  }

  const updated = { ...data };

  // SCENARIO A: User changed Calories - recalculate all macros with default distribution
  if (editedField === "dailyCalorieGoal") {
    const proteinCals = cal * 0.30;
    const carbsCals = cal * 0.40;
    const fatCals = cal * 0.30;

    updated.dailyProteinGoal = Math.round(proteinCals / 4).toString();
    updated.dailyCarbsGoal = Math.round(carbsCals / 4).toString();
    updated.dailyFatGoal = Math.round(fatCals / 9).toString();
    return updated;
  }

  // SCENARIO B: User changed a specific macro - keep calories fixed, recalculate others
  const totalFromMacros = (prot * 4) + (carbs * 4) + (fat * 9);
  const diff = totalFromMacros - cal;

  if (Math.abs(diff) > 5) {
    if (editedField === "dailyProteinGoal") {
      const remainingCals = cal - (prot * 4);
      if (remainingCals < 0) {
        const maxProt = Math.max(0, Math.round((cal * 0.50) / 4));
        updated.dailyProteinGoal = maxProt.toString();
        const newRemaining = cal - (maxProt * 4);
        updated.dailyCarbsGoal = Math.round((newRemaining * 0.57) / 4).toString();
        updated.dailyFatGoal = Math.round((newRemaining * 0.43) / 9).toString();
      } else {
        updated.dailyCarbsGoal = Math.round((remainingCals * 0.57) / 4).toString();
        updated.dailyFatGoal = Math.round((remainingCals * 0.43) / 9).toString();
      }
    } else if (editedField === "dailyCarbsGoal") {
      const remainingCals = cal - (carbs * 4);
      if (remainingCals < 0) {
        const maxCarbs = Math.max(0, Math.round((cal * 0.50) / 4));
        updated.dailyCarbsGoal = maxCarbs.toString();
        const newRemaining = cal - (maxCarbs * 4);
        updated.dailyProteinGoal = Math.round((newRemaining * 0.50) / 4).toString();
        updated.dailyFatGoal = Math.round((newRemaining * 0.50) / 9).toString();
      } else {
        updated.dailyProteinGoal = Math.round((remainingCals * 0.50) / 4).toString();
        updated.dailyFatGoal = Math.round((remainingCals * 0.50) / 9).toString();
      }
    } else if (editedField === "dailyFatGoal") {
      const remainingCals = cal - (fat * 9);
      if (remainingCals < 0) {
        const maxFat = Math.max(0, Math.round((cal * 0.30) / 9));
        updated.dailyFatGoal = maxFat.toString();
        const newRemaining = cal - (maxFat * 9);
        updated.dailyProteinGoal = Math.round((newRemaining * 0.30) / 4).toString();
        updated.dailyCarbsGoal = Math.round((newRemaining * 0.70) / 4).toString();
      } else {
        updated.dailyProteinGoal = Math.round((remainingCals * 0.30) / 4).toString();
        updated.dailyCarbsGoal = Math.round((remainingCals * 0.70) / 4).toString();
      }
    }
  }

  return updated;
}

describe("Macro Reactivity Logic", () => {
  describe("Scenario A: Changing Calories", () => {
    it("should recalculate all macros when calories change (30% protein, 40% carbs, 30% fat)", () => {
      const data: FormData = {
        dailyCalorieGoal: "2000",
        dailyProteinGoal: "100",
        dailyCarbsGoal: "200",
        dailyFatGoal: "50",
      };

      const result = recalcMacros(data, "dailyCalorieGoal");

      // 30% of 2000 = 600 kcal / 4 = 150g protein
      expect(result.dailyProteinGoal).toBe("150");
      // 40% of 2000 = 800 kcal / 4 = 200g carbs
      expect(result.dailyCarbsGoal).toBe("200");
      // 30% of 2000 = 600 kcal / 9 = 67g fat
      expect(result.dailyFatGoal).toBe("67");
    });

    it("should handle lower calorie targets", () => {
      const data: FormData = {
        dailyCalorieGoal: "1500",
        dailyProteinGoal: "100",
        dailyCarbsGoal: "200",
        dailyFatGoal: "50",
      };

      const result = recalcMacros(data, "dailyCalorieGoal");

      // 30% of 1500 = 450 kcal / 4 = 112.5g protein (rounded to 113)
      expect(result.dailyProteinGoal).toBe("113");
      // 40% of 1500 = 600 kcal / 4 = 150g carbs
      expect(result.dailyCarbsGoal).toBe("150");
      // 30% of 1500 = 450 kcal / 9 = 50g fat
      expect(result.dailyFatGoal).toBe("50");
    });

    it("should handle higher calorie targets", () => {
      const data: FormData = {
        dailyCalorieGoal: "3000",
        dailyProteinGoal: "100",
        dailyCarbsGoal: "200",
        dailyFatGoal: "50",
      };

      const result = recalcMacros(data, "dailyCalorieGoal");

      // 30% of 3000 = 900 kcal / 4 = 225g protein
      expect(result.dailyProteinGoal).toBe("225");
      // 40% of 3000 = 1200 kcal / 4 = 300g carbs
      expect(result.dailyCarbsGoal).toBe("300");
      // 30% of 3000 = 900 kcal / 9 = 100g fat
      expect(result.dailyFatGoal).toBe("100");
    });
  });

  describe("Scenario B: Changing Individual Macros", () => {
    it("should redistribute carbs and fat when protein changes", () => {
      const data: FormData = {
        dailyCalorieGoal: "2000",
        dailyProteinGoal: "150", // 600 kcal
        dailyCarbsGoal: "200",
        dailyFatGoal: "67",
      };

      const result = recalcMacros(data, "dailyProteinGoal");

      // Remaining: 2000 - (150 * 4) = 1400 kcal
      // Carbs: 1400 * 0.57 / 4 = 200g
      expect(result.dailyCarbsGoal).toBe("200");
      // Fat: 1400 * 0.43 / 9 = 67g
      expect(result.dailyFatGoal).toBe("67");
    });

    it("should redistribute protein and fat when carbs change", () => {
      const data: FormData = {
        dailyCalorieGoal: "2000",
        dailyProteinGoal: "150",
        dailyCarbsGoal: "250", // 1000 kcal
        dailyFatGoal: "67",
      };

      const result = recalcMacros(data, "dailyCarbsGoal");

      // Remaining: 2000 - (250 * 4) = 1000 kcal
      // Protein: 1000 * 0.50 / 4 = 125g
      expect(result.dailyProteinGoal).toBe("125");
      // Fat: 1000 * 0.50 / 9 = 56g
      expect(result.dailyFatGoal).toBe("56");
    });

    it("should redistribute protein and carbs when fat changes", () => {
      const data: FormData = {
        dailyCalorieGoal: "2000",
        dailyProteinGoal: "150",
        dailyCarbsGoal: "200",
        dailyFatGoal: "100", // 900 kcal
      };

      const result = recalcMacros(data, "dailyFatGoal");

      // Remaining: 2000 - (100 * 9) = 1100 kcal
      // Protein: 1100 * 0.30 / 4 = 82.5g (rounded to 83)
      expect(result.dailyProteinGoal).toBe("83");
      // Carbs: 1100 * 0.70 / 4 = 192.5g (rounded to 193)
      expect(result.dailyCarbsGoal).toBe("193");
    });
  });

  describe("Edge Cases", () => {
    it("should handle impossible macro combinations (protein too high)", () => {
      const data: FormData = {
        dailyCalorieGoal: "2000",
        dailyProteinGoal: "600", // 2400 kcal - exceeds total!
        dailyCarbsGoal: "200",
        dailyFatGoal: "67",
      };

      const result = recalcMacros(data, "dailyProteinGoal");

      // Should cap protein and redistribute
      const proteinCals = Number(result.dailyProteinGoal) * 4;
      const carbsCals = Number(result.dailyCarbsGoal) * 4;
      const fatCals = Number(result.dailyFatGoal) * 9;
      const total = proteinCals + carbsCals + fatCals;

      // Allow up to 50 kcal tolerance due to rounding
      expect(total).toBeLessThanOrEqual(2050);
    });

    it("should handle zero calories gracefully", () => {
      const data: FormData = {
        dailyCalorieGoal: "0",
        dailyProteinGoal: "100",
        dailyCarbsGoal: "200",
        dailyFatGoal: "50",
      };

      const result = recalcMacros(data, "dailyCalorieGoal");

      // Should return unchanged
      expect(result.dailyCalorieGoal).toBe("0");
    });

    it("should handle negative calories gracefully", () => {
      const data: FormData = {
        dailyCalorieGoal: "-1000",
        dailyProteinGoal: "100",
        dailyCarbsGoal: "200",
        dailyFatGoal: "50",
      };

      const result = recalcMacros(data, "dailyCalorieGoal");

      // Should return unchanged
      expect(result.dailyCalorieGoal).toBe("-1000");
    });

    it("should maintain calorie balance within tolerance", () => {
      const data: FormData = {
        dailyCalorieGoal: "2000",
        dailyProteinGoal: "150",
        dailyCarbsGoal: "200",
        dailyFatGoal: "67",
      };

      const result = recalcMacros(data, "dailyProteinGoal");

      const totalCals = (Number(result.dailyProteinGoal) * 4) +
                       (Number(result.dailyCarbsGoal) * 4) +
                       (Number(result.dailyFatGoal) * 9);

      // Should be within 100 kcal of target (accounting for rounding)
      expect(Math.abs(totalCals - 2000)).toBeLessThanOrEqual(100);
    });
  });
});
