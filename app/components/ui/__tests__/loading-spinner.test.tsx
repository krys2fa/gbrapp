import { render, screen } from "@testing-library/react";
import LoadingSpinner, {
  TableLoadingSpinner,
  PageLoadingSpinner,
  ButtonLoadingSpinner,
  ModalLoadingSpinner,
} from "../loading-spinner";

describe("LoadingSpinner Components", () => {
  describe("LoadingSpinner", () => {
    it("renders with default props", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status", { hidden: true });
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass(
        "animate-spin",
        "text-indigo-600",
        "h-6",
        "w-6"
      );
    });

    it("renders with custom size", () => {
      render(<LoadingSpinner size="lg" />);
      const spinner = screen.getByRole("status", { hidden: true });
      expect(spinner).toHaveClass("h-8", "w-8");
    });

    it("renders with message", () => {
      render(<LoadingSpinner message="Loading data..." />);
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });

    it("renders inline layout", () => {
      render(<LoadingSpinner inline message="Processing..." />);
      const container = screen.getByText("Processing...").parentElement;
      expect(container).toHaveClass("inline-flex");
    });

    it("renders without centering", () => {
      render(<LoadingSpinner centered={false} />);
      const container = screen.getByRole("status", {
        hidden: true,
      }).parentElement;
      expect(container).not.toHaveClass("justify-center");
    });
  });

  describe("TableLoadingSpinner", () => {
    it("renders with default message", () => {
      render(<TableLoadingSpinner />);
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });

    it("renders with custom message", () => {
      render(<TableLoadingSpinner message="Loading job cards..." />);
      expect(screen.getByText("Loading job cards...")).toBeInTheDocument();
    });

    it("has proper table loading styling", () => {
      render(<TableLoadingSpinner />);
      const container = screen.getByText("Loading data...").closest("div");
      expect(container).toHaveClass("py-12");
    });
  });

  describe("PageLoadingSpinner", () => {
    it("renders with default message", () => {
      render(<PageLoadingSpinner />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("has proper page loading styling", () => {
      render(<PageLoadingSpinner />);
      const container = screen.getByText("Loading...").closest("div");
      expect(container).toHaveClass("min-h-[400px]");
    });
  });

  describe("ButtonLoadingSpinner", () => {
    it("renders inline layout", () => {
      render(<ButtonLoadingSpinner message="Saving..." />);
      const container = screen.getByText("Saving...").parentElement;
      expect(container).toHaveClass("inline-flex");
    });

    it("uses small size", () => {
      render(<ButtonLoadingSpinner />);
      const spinner = screen.getByRole("status", { hidden: true });
      expect(spinner).toHaveClass("h-4", "w-4");
    });
  });

  describe("ModalLoadingSpinner", () => {
    it("renders with default message", () => {
      render(<ModalLoadingSpinner />);
      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });

    it("has proper modal loading styling", () => {
      render(<ModalLoadingSpinner />);
      const container = screen.getByText("Processing...").closest("div");
      expect(container).toHaveClass("py-6");
    });
  });

  describe("Accessibility", () => {
    it("has accessible spinner element", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status", { hidden: true });
      expect(spinner).toBeInTheDocument();
    });

    it("has accessible text for screen readers", () => {
      render(<LoadingSpinner message="Loading content..." />);
      expect(screen.getByText("Loading content...")).toBeInTheDocument();
    });
  });

  describe("Consistency", () => {
    it("all variants use indigo-600 color", () => {
      const { rerender } = render(<TableLoadingSpinner />);
      expect(screen.getByRole("status", { hidden: true })).toHaveClass(
        "text-indigo-600"
      );

      rerender(<PageLoadingSpinner />);
      expect(screen.getByRole("status", { hidden: true })).toHaveClass(
        "text-indigo-600"
      );

      rerender(<ButtonLoadingSpinner />);
      expect(screen.getByRole("status", { hidden: true })).toHaveClass(
        "text-indigo-600"
      );

      rerender(<ModalLoadingSpinner />);
      expect(screen.getByRole("status", { hidden: true })).toHaveClass(
        "text-indigo-600"
      );
    });

    it("all variants use Loader2 icon", () => {
      const { rerender } = render(<TableLoadingSpinner />);
      expect(screen.getByRole("status", { hidden: true })).toHaveClass(
        "animate-spin"
      );

      rerender(<PageLoadingSpinner />);
      expect(screen.getByRole("status", { hidden: true })).toHaveClass(
        "animate-spin"
      );

      rerender(<ButtonLoadingSpinner />);
      expect(screen.getByRole("status", { hidden: true })).toHaveClass(
        "animate-spin"
      );

      rerender(<ModalLoadingSpinner />);
      expect(screen.getByRole("status", { hidden: true })).toHaveClass(
        "animate-spin"
      );
    });
  });
});
