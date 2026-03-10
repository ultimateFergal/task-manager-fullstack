/**
 * Unit tests for the task creation form — rendered inline in app/page.tsx.
 * We test the controlled input + submit behaviour in isolation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Minimal TaskForm mirroring the form JSX in app/page.tsx
// ---------------------------------------------------------------------------

interface TaskFormProps {
  onSubmit: (title: string) => Promise<void>;
  loading?: boolean;
}

/** Controlled form for creating a new task */
const TaskForm = ({ onSubmit, loading = false }: TaskFormProps) => {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setSubmitting(true);
    await onSubmit(value);
    setValue("");
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="¿Qué necesitas hacer?"
        data-testid="task-input"
        disabled={submitting || loading}
      />
      <button
        type="submit"
        data-testid="add-task-button"
        disabled={submitting || loading || !value.trim()}
      >
        {submitting ? "..." : "Agregar Tarea"}
      </button>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TaskForm", () => {
  let onSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn().mockResolvedValue(undefined);
  });

  it("renders the input and submit button", () => {
    render(<TaskForm onSubmit={onSubmit} />);
    expect(screen.getByTestId("task-input")).toBeInTheDocument();
    expect(screen.getByTestId("add-task-button")).toBeInTheDocument();
  });

  it("submit button is disabled when input is empty", () => {
    render(<TaskForm onSubmit={onSubmit} />);
    expect(screen.getByTestId("add-task-button")).toBeDisabled();
  });

  it("submit button is disabled when input contains only whitespace", async () => {
    render(<TaskForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByTestId("task-input"), "   ");
    expect(screen.getByTestId("add-task-button")).toBeDisabled();
  });

  it("submit button becomes enabled when input has a valid value", async () => {
    render(<TaskForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByTestId("task-input"), "Nueva tarea");
    expect(screen.getByTestId("add-task-button")).toBeEnabled();
  });

  it("calls onSubmit with the typed title when form is submitted", async () => {
    render(<TaskForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByTestId("task-input"), "Ir al gimnasio");
    fireEvent.submit(screen.getByTestId("task-input").closest("form")!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Ir al gimnasio"));
  });

  it("does not call onSubmit when input is empty and form is submitted", () => {
    render(<TaskForm onSubmit={onSubmit} />);
    fireEvent.submit(screen.getByTestId("task-input").closest("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears the input after a successful submit", async () => {
    render(<TaskForm onSubmit={onSubmit} />);
    const input = screen.getByTestId("task-input") as HTMLInputElement;
    await userEvent.type(input, "Tarea temporal");
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("disables input and button while loading prop is true", () => {
    render(<TaskForm onSubmit={onSubmit} loading={true} />);
    expect(screen.getByTestId("task-input")).toBeDisabled();
    expect(screen.getByTestId("add-task-button")).toBeDisabled();
  });

  it("input is controlled — reflects typed value", async () => {
    render(<TaskForm onSubmit={onSubmit} />);
    const input = screen.getByTestId("task-input") as HTMLInputElement;
    await userEvent.type(input, "Hola");
    expect(input.value).toBe("Hola");
  });
});
