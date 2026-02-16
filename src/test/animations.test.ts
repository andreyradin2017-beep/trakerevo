import { describe, it, expect } from "vitest";
import { cardVariants, fadeVariants, EASINGS } from "../utils/animations";

describe("Animation Variants", () => {
  describe("cardVariants", () => {
    it("should have correct hidden state", () => {
      expect(cardVariants.hidden).toEqual({ opacity: 0, y: 20, scale: 0.95 });
    });

    it("should generate correct visible state with delay", () => {
      const index = 5;
      const visibleState = (cardVariants.visible as Function)(index);

      expect(visibleState.opacity).toBe(1);
      expect(visibleState.y).toBe(0);
      expect(visibleState.transition.delay).toBe(index * 0.05);
      expect(visibleState.transition.ease).toBe(EASINGS.bounce);
    });
  });

  describe("fadeVariants", () => {
    it("should have opacity 0 in hidden and exit states", () => {
      expect(fadeVariants.hidden).toHaveProperty("opacity", 0);
      expect(fadeVariants.exit).toHaveProperty("opacity", 0);
    });

    it("should have opacity 1 in visible state", () => {
      expect(fadeVariants.visible).toHaveProperty("opacity", 1);
    });
  });
});
