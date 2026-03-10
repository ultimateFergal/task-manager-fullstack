/**
 * Integration tests for DELETE /api/tasks
 * Mocks the Supabase client so no real DB calls are made.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "@/app/api/tasks/route";

// ---------------------------------------------------------------------------
// Mock @/lib/supabase
// ---------------------------------------------------------------------------

/**
 * Mock function for testing equality comparisons in API delete operations.
 * Used to simulate and verify `eq` (equality) assertions in task deletion scenarios.
 * The naming convention "mockEq" indicates this is a mock implementation of an equality check function.
 */
const mockEq = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: mockDelete.mockReturnValue({
        eq: mockEq,
      }),
    })),
  },
}));

// ---------------------------------------------------------------------------
// Helper — builds a Request with a JSON body
// ---------------------------------------------------------------------------

const makeRequest = (body: unknown) =>
  new Request("http://localhost/api/tasks", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DELETE /api/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a task and returns status 204", async () => {
    mockEq.mockResolvedValue({ error: null });

    const response = await DELETE(makeRequest({ id: "abc-123" }));

    expect(response.status).toBe(204);
  });

  it("returns an empty body on success", async () => {
    mockEq.mockResolvedValue({ error: null });

    const response = await DELETE(makeRequest({ id: "abc-123" }));
    const text = await response.text();

    expect(text).toBe("");
  });

  it("calls delete with the correct task id", async () => {
    mockEq.mockResolvedValue({ error: null });

    await DELETE(makeRequest({ id: "abc-123" }));

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "abc-123");
  });

  it("returns status 400 when id is missing", async () => {
    const response = await DELETE(makeRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toHaveProperty("error");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns status 500 when Supabase returns an error", async () => {
    mockEq.mockResolvedValue({ error: { message: "DB error" } });

    const response = await DELETE(makeRequest({ id: "abc-123" }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty("error");
  });
});
