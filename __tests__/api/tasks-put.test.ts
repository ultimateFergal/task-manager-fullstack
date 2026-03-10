/**
 * Integration tests for PUT /api/tasks
 * Mocks the Supabase client so no real DB calls are made.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "@/app/api/tasks/route";

// ---------------------------------------------------------------------------
// Mock @/lib/supabase
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockUpdateSelect = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({
          select: mockUpdateSelect.mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
    })),
  },
}));

// ---------------------------------------------------------------------------
// Helper — builds a Request with a JSON body
// ---------------------------------------------------------------------------

const makeRequest = (body: unknown) =>
  new Request("http://localhost/api/tasks", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PUT /api/tasks", () => {
  const updatedTask = {
    id: "abc-123",
    title: "Tarea existente",
    completed: true,
    created_at: "2026-02-28T10:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a task and returns status 200", async () => {
    mockSingle.mockResolvedValue({ data: updatedTask, error: null });

    const response = await PUT(makeRequest({ id: "abc-123", completed: true }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(updatedTask);
  });

  it("calls update with the correct completed value", async () => {
    mockSingle.mockResolvedValue({ data: updatedTask, error: null });

    await PUT(makeRequest({ id: "abc-123", completed: true }));

    expect(mockUpdate).toHaveBeenCalledWith({ completed: true });
    expect(mockEq).toHaveBeenCalledWith("id", "abc-123");
  });

  it("can set completed to false", async () => {
    const pendingTask = { ...updatedTask, completed: false };
    mockSingle.mockResolvedValue({ data: pendingTask, error: null });

    const response = await PUT(makeRequest({ id: "abc-123", completed: false }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.completed).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith({ completed: false });
  });

  it("returns status 400 when id is missing", async () => {
    const response = await PUT(makeRequest({ completed: true }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("returns status 400 when completed is not a boolean", async () => {
    const response = await PUT(makeRequest({ id: "abc-123", completed: "yes" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("returns status 400 when completed is missing", async () => {
    const response = await PUT(makeRequest({ id: "abc-123" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("returns status 500 when Supabase returns an error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const response = await PUT(makeRequest({ id: "abc-123", completed: true }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty("error");
  });
});
