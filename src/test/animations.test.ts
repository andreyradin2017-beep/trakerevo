import { describe, it, expect } from "vitest";
import { cardVariants, pageVariants, EASINGS } from "../utils/animations";

describe("Animation Variants", () => {
  describe("cardVariants", () => {
    it("should have correct hidden state", () => {
      expect(cardVariants.hidden).toEqual({ opacity: 0, scale: 0.9, y: 20 });
    });

    it("should generate correct visible state with delay", () => {
      const index = 5;
      const visibleState = (cardVariants.visible as Function)(index);

      expect(visibleState.opacity).toBe(1);
      expect(visibleState.y).toBe(0);
      expect(visibleState.transition.delay).toBe(index * 0.015);
      expect(visibleState.transition.ease).toBe(EASINGS.out);
    });
  });

  describe("pageVariants", () => {
    it("should have correct initial state", () => {
      expect(pageVariants.initial).toEqual({ opacity: 0, scale: 0.98, y: 10 });
    });

    it("should have correct enter state", () => {
      const enter = pageVariants.enter as any;
      expect(enter.opacity).toBe(1);
      expect(enter.scale).toBe(1);
      expect(enter.y).toBe(0);
    });
  });
});
