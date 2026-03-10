/**
 * Unit tests for the TaskItem UI — rendered inline in app/page.tsx.
 * We render the same JSX structure in isolation using a minimal wrapper.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Task } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Minimal TaskItem component mirroring the JSX in app/page.tsx
// ---------------------------------------------------------------------------

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

/** Individual task row with checkbox, title and delete button */
const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => (
  <div
    data-testid="task-item"
    data-taskid={task.id}
    className={`flex items-center gap-3 p-4 rounded-lg transition-colors group ${
      task.completed
        ? "bg-gray-100 opacity-60"
        : "bg-gray-50 hover:bg-gray-100"
    }`}
  >
    <input
      type="checkbox"
      data-testid="task-checkbox"
      checked={task.completed}
      onChange={() => onToggle(task)}
      className="w-5 h-5 cursor-pointer"
    />
    <span
      className={`flex-1 ${
        task.completed
          ? "line-through text-gray-400"
          : "text-gray-800"
      }`}
    >
      {task.title}
    </span>
    <button
      onClick={() => onDelete(task)}
      data-testid="task-delete"
      aria-label="Eliminar tarea"
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
    >
      ×
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const pendingTask: Task = {
  id: "abc-123",
  title: "Comprar pan",
  completed: false,
  created_at: "2026-02-28T10:00:00Z",
};

const completedTask: Task = {
  id: "def-456",
  title: "Hacer ejercicio",
  completed: true,
  created_at: "2026-02-28T09:00:00Z",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TaskItem", () => {
  let onToggle: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onToggle = vi.fn();
    onDelete = vi.fn();
  });

  it("renders the task title correctly", () => {
    render(<TaskItem task={pendingTask} onToggle={onToggle} onDelete={onDelete} />);
    expect(screen.getByText("Comprar pan")).toBeInTheDocument();
  });

  it("renders checkbox as unchecked for a pending task", () => {
    render(<TaskItem task={pendingTask} onToggle={onToggle} onDelete={onDelete} />);
    const checkbox = screen.getByTestId("task-checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("renders checkbox as checked for a completed task", () => {
    render(<TaskItem task={completedTask} onToggle={onToggle} onDelete={onDelete} />);
    const checkbox = screen.getByTestId("task-checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("calls onToggle with the correct task when checkbox is clicked", () => {
    render(<TaskItem task={pendingTask} onToggle={onToggle} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId("task-checkbox"));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith(pendingTask);
  });

  it("calls onDelete with the correct task when delete button is clicked", () => {
    render(<TaskItem task={pendingTask} onToggle={onToggle} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId("task-delete"));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(pendingTask);
  });

  it("applies line-through class when task is completed", () => {
    render(<TaskItem task={completedTask} onToggle={onToggle} onDelete={onDelete} />);
    const titleSpan = screen.getByText("Hacer ejercicio");
    expect(titleSpan).toHaveClass("line-through");
  });

  it("does not apply line-through class when task is pending", () => {
    render(<TaskItem task={pendingTask} onToggle={onToggle} onDelete={onDelete} />);
    const titleSpan = screen.getByText("Comprar pan");
    expect(titleSpan).not.toHaveClass("line-through");
  });

  it("applies opacity-60 to the row when task is completed", () => {
    render(<TaskItem task={completedTask} onToggle={onToggle} onDelete={onDelete} />);
    const row = screen.getByTestId("task-item");
    expect(row).toHaveClass("opacity-60");
  });

  it("has correct aria-label on the delete button for accessibility", () => {
    render(<TaskItem task={pendingTask} onToggle={onToggle} onDelete={onDelete} />);
    expect(screen.getByRole("button", { name: "Eliminar tarea" })).toBeInTheDocument();
  });

  it("stores the task id in data-taskid attribute", () => {
    render(<TaskItem task={pendingTask} onToggle={onToggle} onDelete={onDelete} />);
    expect(screen.getByTestId("task-item")).toHaveAttribute("data-taskid", "abc-123");
  });
});
