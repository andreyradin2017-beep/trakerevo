import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HLTBTile } from "../components/HLTBTile";
import { DetailDescription } from "../components/DetailDescription";
import { ItemNotesAndList } from "../components/ItemNotesAndList";

describe("ItemDetail Components", () => {
  describe("HLTBTile", () => {
    it("renders HLTB stats correctly", () => {
      const hltb = {
        main: "10h",
        extra: "15h",
        completionist: "25h",
      };
      render(<HLTBTile hltb={hltb} />);

      expect(screen.getByText("10h")).toBeDefined();
      expect(screen.getByText("15h")).toBeDefined();
      expect(screen.getByText("25h")).toBeDefined();
      expect(screen.getByText(/HowLongToBeat/i)).toBeDefined();
    });
  });

  describe("DetailDescription", () => {
    it("renders description text", () => {
      render(<DetailDescription description="Test description" />);
      expect(screen.getByText("Test description")).toBeDefined();
      expect(screen.getByText(/Об инструменте \/ Сюжет/i)).toBeDefined();
    });
  });

  describe("ItemNotesAndList", () => {
    const mockLists = [
      { id: 1, name: "List 1", color: "red", createdAt: new Date() },
      { id: 2, name: "List 2", color: "blue", createdAt: new Date() },
    ];
    const mockProps = {
      notes: "My notes",
      setNotes: vi.fn(),
      selectedListId: 1,
      setSelectedListId: vi.fn(),
      lists: mockLists,
      onSave: vi.fn(),
      onDelete: vi.fn(),
    };

    it("renders notes and allows editing", () => {
      render(<ItemNotesAndList {...mockProps} />);

      const textarea = screen.getByPlaceholderText(/О чем этот тайтл/i);
      expect((textarea as HTMLTextAreaElement).value).toBe("My notes");

      fireEvent.change(textarea, { target: { value: "New notes" } });
      expect(mockProps.setNotes).toHaveBeenCalledWith("New notes");
    });

    it("renders list options and handles change", () => {
      render(<ItemNotesAndList {...mockProps} />);

      const select = screen.getByDisplayValue("List 1");
      expect(select).toBeDefined();

      fireEvent.change(select, { target: { value: "2" } });
      expect(mockProps.setSelectedListId).toHaveBeenCalledWith(2);
    });

    it("handles save and delete clicks", () => {
      const { container } = render(<ItemNotesAndList {...mockProps} />);

      const saveBtn = screen.getByText(/Сохранить/i);
      fireEvent.click(saveBtn);
      expect(mockProps.onSave).toHaveBeenCalled();

      // Find the delete button by its specific style/class since it has no text
      const deleteBtn = container.querySelector(
        '.btn-icon[style*="rgba(239, 68, 68, 0.1)"]',
      );
      if (deleteBtn) {
        fireEvent.click(deleteBtn);
        expect(mockProps.onDelete).toHaveBeenCalled();
      } else {
        throw new Error("Delete button not found");
      }
    });
  });
});
