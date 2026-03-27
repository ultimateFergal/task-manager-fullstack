/**
 * Integration tests for GET /api/tasks
 * Mocks supabaseAdmin and the auth session — no real DB or network calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/tasks/route";
import type { Session } from "next-auth";

// ---------------------------------------------------------------------------
// Mock @/lib/auth
// ---------------------------------------------------------------------------

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/supabase-server
// Chain: from → select → eq → order
// ---------------------------------------------------------------------------

const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
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

const sampleTasks = [
  { id: "1", title: "Task A", completed: false, created_at: "2026-02-28T10:00:00Z", user_id: USER_ID },
  { id: "2", title: "Task B", completed: true,  created_at: "2026-02-28T09:00:00Z", user_id: USER_ID },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/tasks", () => {
  let auth: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const authModule = await import("@/lib/auth");
    auth = vi.mocked(authModule.auth);
  });

  describe("autenticado", () => {
    beforeEach(() => {
      auth.mockResolvedValue(mockSession);
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

    it("filters tasks by the authenticated user_id", async () => {
      mockOrder.mockResolvedValue({ data: sampleTasks, error: null });

      await GET();

      expect(mockEq).toHaveBeenCalledWith("user_id", USER_ID);
    });

    it("orders tasks by created_at descending", async () => {
      mockOrder.mockResolvedValue({ data: sampleTasks, error: null });

      await GET();

      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("returns status 500 when Supabase returns an error", async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toHaveProperty("error");
    });
  });

  describe("no autenticado", () => {
    it("returns status 401 when there is no session", async () => {
      auth.mockResolvedValue(null);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toHaveProperty("error");
      expect(mockOrder).not.toHaveBeenCalled();
    });
  });
});
