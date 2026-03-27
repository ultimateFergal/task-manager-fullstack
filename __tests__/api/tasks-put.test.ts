/**
 * Integration tests for PUT /api/tasks
 * Mocks supabaseAdmin and the auth session — no real DB or network calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "@/app/api/tasks/route";
import type { Session } from "next-auth";

// ---------------------------------------------------------------------------
// Mock @/lib/auth
// ---------------------------------------------------------------------------

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/supabase-server
// Chain: from → update → eq(id) → eq(user_id) → select → single
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockUpdateSelect = vi.fn();
const mockEqUser = vi.fn();
const mockEqId = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      update: mockUpdate.mockReturnValue({
        eq: mockEqId.mockReturnValue({
          eq: mockEqUser.mockReturnValue({
            select: mockUpdateSelect.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      }),
    })),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = "user-uuid-123";

const mockSession: Session = {
  user: { id: USER_ID, email: "test@test.com", name: "Test User" },
  expires: "2099-01-01",
};

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
  let auth: ReturnType<typeof vi.fn>;

  const updatedTask = {
    id: "abc-123",
    title: "Tarea existente",
    completed: true,
    created_at: "2026-02-28T10:00:00Z",
    user_id: USER_ID,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const authModule = await import("@/lib/auth");
    auth = vi.mocked(authModule.auth);
  });

  describe("autenticado", () => {
    beforeEach(() => {
      auth.mockResolvedValue(mockSession);
    });

    it("updates a task and returns status 200", async () => {
      mockSingle.mockResolvedValue({ data: updatedTask, error: null });

      const response = await PUT(makeRequest({ id: "abc-123", completed: true }));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(updatedTask);
    });

    it("calls update with the correct completed value and scopes by id and user_id", async () => {
      mockSingle.mockResolvedValue({ data: updatedTask, error: null });

      await PUT(makeRequest({ id: "abc-123", completed: true }));

      expect(mockUpdate).toHaveBeenCalledWith({ completed: true });
      expect(mockEqId).toHaveBeenCalledWith("id", "abc-123");
      expect(mockEqUser).toHaveBeenCalledWith("user_id", USER_ID);
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

  describe("no autenticado", () => {
    it("returns status 401 when there is no session", async () => {
      auth.mockResolvedValue(null);

      const response = await PUT(makeRequest({ id: "abc-123", completed: true }));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toHaveProperty("error");
      expect(mockSingle).not.toHaveBeenCalled();
    });
  });
});
