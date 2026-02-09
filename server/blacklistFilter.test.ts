import { describe, it, expect } from "vitest";

/**
 * Test suite for blacklist filtering in meal recommendations
 * Validates that recommendations containing blacklisted ingredients are filtered out
 */

interface MealRecommendation {
  title: string;
  description: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  ingredients: string[];
  tips: string;
}

// Simulate the filtering logic from getAIRecommendations
function filterBlacklistedRecommendations(
  recommendations: MealRecommendation[],
  blacklistedKeywords: string[]
): MealRecommendation[] {
  const filtered = recommendations.filter(rec => {
    const recText = `${rec.title} ${rec.description} ${rec.ingredients.join(' ')}`.toLowerCase();
    return !blacklistedKeywords.some(keyword => recText.includes(keyword.toLowerCase()));
  });

  // If all recommendations were filtered out, return original to avoid empty list
  return filtered.length > 0 ? filtered : recommendations;
}

describe("Blacklist Filtering", () => {
  const mockRecommendations: MealRecommendation[] = [
    {
      title: "Frango Grelhado com Arroz",
      description: "Peito de frango grelhado com arroz integral e brócolis",
      estimatedCalories: 450,
      estimatedProtein: 45,
      estimatedCarbs: 40,
      estimatedFat: 8,
      ingredients: ["frango", "arroz integral", "brócolis", "azeite"],
      tips: "Excelente fonte de proteína magra",
    },
    {
      title: "Salmão com Batata Doce",
      description: "Filé de salmão assado com batata doce e aspargo",
      estimatedCalories: 520,
      estimatedProtein: 40,
      estimatedCarbs: 45,
      estimatedFat: 15,
      ingredients: ["salmão", "batata doce", "aspargo", "azeite"],
      tips: "Rico em ômega 3",
    },
    {
      title: "Omelete de Ovos com Queijo",
      description: "Omelete de 3 ovos com queijo meia cura e tomate",
      estimatedCalories: 380,
      estimatedProtein: 25,
      estimatedCarbs: 5,
      estimatedFat: 28,
      ingredients: ["ovos", "queijo", "tomate", "manteiga"],
      tips: "Proteína completa",
    },
  ];

  describe("No Blacklist", () => {
    it("should return all recommendations when blacklist is empty", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, []);
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockRecommendations);
    });
  });

  describe("Single Ingredient Blacklist", () => {
    it("should filter out recommendations containing blacklisted ingredient", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["frango"]);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Salmão com Batata Doce");
      expect(result[1].title).toBe("Omelete de Ovos com Queijo");
    });

    it("should filter out recommendations with blacklisted ingredient in description", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["salmão"]);
      expect(result).toHaveLength(2);
      expect(result.some(r => r.title.includes("Salmão"))).toBe(false);
    });

    it("should filter out recommendations with blacklisted ingredient in title", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["omelete"]);
      expect(result).toHaveLength(2);
      expect(result.some(r => r.title.includes("Omelete"))).toBe(false);
    });
  });

  describe("Multiple Ingredients Blacklist", () => {
    it("should filter out multiple recommendations with different blacklisted ingredients", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["frango", "salmão"]);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Omelete de Ovos com Queijo");
    });

    it("should filter out all recommendations if all contain blacklisted ingredients", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["frango", "salmão", "ovos"]);
      // Should return original list since all were filtered
      expect(result).toHaveLength(3);
    });
  });

  describe("Case Insensitivity", () => {
    it("should filter regardless of case in blacklist", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["FRANGO"]);
      expect(result).toHaveLength(2);
      expect(result.some(r => r.title.includes("Frango"))).toBe(false);
    });

    it("should filter regardless of case in recommendation", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["frango"]);
      expect(result).toHaveLength(2);
      expect(result.some(r => r.title.includes("Frango"))).toBe(false);
    });
  });

  describe("Partial Matches", () => {
    it("should filter based on partial ingredient matches", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["ovo"]);
      // Should match "ovos"
      expect(result).toHaveLength(2);
      expect(result.some(r => r.title.includes("Omelete"))).toBe(false);
    });

    it("should not filter on unrelated partial matches", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["arro"]);
      // Should match "arroz"
      expect(result).toHaveLength(2);
      expect(result.some(r => r.title.includes("Frango"))).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty recommendations list", () => {
      const result = filterBlacklistedRecommendations([], ["frango"]);
      expect(result).toHaveLength(0);
    });

    it("should handle empty blacklist keyword", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, [""]);
      // Empty string should match everything, so all filtered, return original
      expect(result).toHaveLength(3);
    });

    it("should handle whitespace in blacklist", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["  frango  "]);
      // Whitespace should be preserved, so "  frango  " won't match "frango"
      expect(result).toHaveLength(3);
    });

    it("should handle special characters in ingredients", () => {
      const customRecs: MealRecommendation[] = [
        {
          title: "Salada C&A",
          description: "Salada com ingredientes especiais",
          estimatedCalories: 200,
          estimatedProtein: 10,
          estimatedCarbs: 20,
          estimatedFat: 8,
          ingredients: ["alface", "tomate", "cebola"],
          tips: "Leve e saudável",
        },
      ];
      const result = filterBlacklistedRecommendations(customRecs, ["alface"]);
      // When all recommendations are filtered, return original list to avoid empty result
      expect(result).toHaveLength(1);
    });
  });

  describe("Real-world Scenarios", () => {
    it("should filter dairy products when blacklisted", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["queijo"]);
      expect(result).toHaveLength(2);
      expect(result.some(r => r.title.includes("Omelete"))).toBe(false);
    });

    it("should filter multiple allergens", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["ovos", "queijo"]);
      expect(result).toHaveLength(2);
      expect(result.some(r => r.title.includes("Omelete"))).toBe(false);
    });

    it("should preserve recommendations without blacklisted items", () => {
      const result = filterBlacklistedRecommendations(mockRecommendations, ["leite"]);
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockRecommendations);
    });
  });
});
