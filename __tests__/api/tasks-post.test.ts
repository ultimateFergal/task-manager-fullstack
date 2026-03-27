/**
 * Integration tests for POST /api/tasks
 * Mocks supabaseAdmin and the auth session — no real DB or network calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/tasks/route";
import type { Session } from "next-auth";

// ---------------------------------------------------------------------------
// Mock @/lib/auth
// ---------------------------------------------------------------------------

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/supabase-server
// Chain: from → insert → select → single
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockInsertSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: {
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
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = "user-uuid-123";

const mockSession: Session = {
  user: { id: USER_ID, email: "test@test.com", name: "Test User" },
  expires: "2099-01-01",
};

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
  let auth: ReturnType<typeof vi.fn>;

  const createdTask = {
    id: "abc-123",
    title: "Nueva tarea",
    completed: false,
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

    it("creates a task and returns status 201", async () => {
      mockSingle.mockResolvedValue({ data: createdTask, error: null });

      const response = await POST(makeRequest({ title: "Nueva tarea" }));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body).toEqual(createdTask);
    });

    it("inserts with trimmed title and the authenticated user_id", async () => {
      mockSingle.mockResolvedValue({ data: createdTask, error: null });

      await POST(makeRequest({ title: "  Nueva tarea  " }));

      expect(mockInsert).toHaveBeenCalledWith([
        { title: "Nueva tarea", user_id: USER_ID },
      ]);
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

  describe("no autenticado", () => {
    it("returns status 401 when there is no session", async () => {
      auth.mockResolvedValue(null);

      const response = await POST(makeRequest({ title: "Tarea" }));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toHaveProperty("error");
      expect(mockSingle).not.toHaveBeenCalled();
    });
  });
});
