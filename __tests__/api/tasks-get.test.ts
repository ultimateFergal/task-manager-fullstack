/**
 * Integration tests for GET /api/tasks
 * Mocks the Supabase client so no real DB calls are made.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/tasks/route";

// ---------------------------------------------------------------------------
// Mock @/lib/supabase so every test controls the Supabase response
// ---------------------------------------------------------------------------

const mockSelect = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        order: mockOrder,
      }),
    })),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleTasks = [
  { id: "1", title: "Task A", completed: false, created_at: "2026-02-28T10:00:00Z" },
  { id: "2", title: "Task B", completed: true,  created_at: "2026-02-28T09:00:00Z" },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of tasks with status 200", async () => {
    mockOrder.mockResolvedValue({ data: sampleTasks, error: null });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(sampleTasks);
  });

  it("returns an empty array when no tasks exist", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("returns status 500 when Supabase returns an error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty("error");
  });

  it("orders tasks by created_at descending", async () => {
    mockOrder.mockResolvedValue({ data: sampleTasks, error: null });

    await GET();

    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});
