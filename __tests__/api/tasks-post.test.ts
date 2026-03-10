/**
 * Integration tests for POST /api/tasks
 * Mocks the Supabase client so no real DB calls are made.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/tasks/route";

// ---------------------------------------------------------------------------
// Mock @/lib/supabase
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockInsertSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert.mockReturnValue({
        select: mockInsertSelect.mockReturnValue({
          single: mockSingle,
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
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/tasks", () => {
  const createdTask = {
    id: "abc-123",
    title: "Nueva tarea",
    completed: false,
    created_at: "2026-02-28T10:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a task and returns status 201", async () => {
    mockSingle.mockResolvedValue({ data: createdTask, error: null });

    const response = await POST(makeRequest({ title: "Nueva tarea" }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual(createdTask);
  });

  it("trims whitespace from the title before inserting", async () => {
    mockSingle.mockResolvedValue({ data: createdTask, error: null });

    await POST(makeRequest({ title: "  Nueva tarea  " }));

    expect(mockInsert).toHaveBeenCalledWith([{ title: "Nueva tarea" }]);
  });

  it("returns status 400 when title is missing", async () => {
    const response = await POST(makeRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("returns status 400 when title is an empty string", async () => {
    const response = await POST(makeRequest({ title: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("returns status 400 when title is only whitespace", async () => {
    const response = await POST(makeRequest({ title: "   " }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
  });

  it("returns status 500 when Supabase returns an error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const response = await POST(makeRequest({ title: "Tarea" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty("error");
  });
});
