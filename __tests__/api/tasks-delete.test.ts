/**
 * Integration tests for DELETE /api/tasks
 * Mocks supabaseAdmin and the auth session — no real DB or network calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "@/app/api/tasks/route";
import type { Session } from "next-auth";

// ---------------------------------------------------------------------------
// Mock @/lib/auth
// ---------------------------------------------------------------------------

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock @/lib/supabase-server
// Chain: from → delete → eq(id) → eq(user_id)
// ---------------------------------------------------------------------------

const mockEqUser = vi.fn();
const mockEqId = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      delete: mockDelete.mockReturnValue({
        eq: mockEqId.mockReturnValue({
          eq: mockEqUser,
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
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DELETE /api/tasks", () => {
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

    it("deletes a task and returns status 204", async () => {
      mockEqUser.mockResolvedValue({ error: null });

      const response = await DELETE(makeRequest({ id: "abc-123" }));

      expect(response.status).toBe(204);
    });

    it("returns an empty body on success", async () => {
      mockEqUser.mockResolvedValue({ error: null });

      const response = await DELETE(makeRequest({ id: "abc-123" }));
      const text = await response.text();

      expect(text).toBe("");
    });

    it("scopes delete by task id and user_id", async () => {
      mockEqUser.mockResolvedValue({ error: null });

      await DELETE(makeRequest({ id: "abc-123" }));

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEqId).toHaveBeenCalledWith("id", "abc-123");
      expect(mockEqUser).toHaveBeenCalledWith("user_id", USER_ID);
    });

    it("returns status 400 when id is missing", async () => {
      const response = await DELETE(makeRequest({}));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("error");
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("returns status 500 when Supabase returns an error", async () => {
      mockEqUser.mockResolvedValue({ error: { message: "DB error" } });

      const response = await DELETE(makeRequest({ id: "abc-123" }));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toHaveProperty("error");
    });
  });

  describe("no autenticado", () => {
    it("returns status 401 when there is no session", async () => {
      auth.mockResolvedValue(null);

      const response = await DELETE(makeRequest({ id: "abc-123" }));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toHaveProperty("error");
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
