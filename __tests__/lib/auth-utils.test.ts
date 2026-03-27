/**
 * Unit tests for lib/auth-utils.ts
 * Covers validateCredentials, createUser, and upsertOAuthUser.
 * Mocks supabaseAdmin and bcryptjs — no real DB or crypto calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock bcryptjs
// ---------------------------------------------------------------------------

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mock @/lib/supabase-server
// Each test sets up the mock chain it needs via mockSingle.
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockInsertSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpsertSelect = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      // validateCredentials: from → select → eq → single
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle,
        }),
      }),
      // createUser: from → insert → select → single
      insert: mockInsert.mockReturnValue({
        select: mockInsertSelect.mockReturnValue({
          single: mockSingle,
        }),
      }),
      // upsertOAuthUser: from → upsert → select → single
      upsert: mockUpsert.mockReturnValue({
        select: mockUpsertSelect.mockReturnValue({
          single: mockSingle,
        }),
      }),
    })),
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("validateCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user data when credentials are valid", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    mockSingle.mockResolvedValue({
      data: { id: "uuid-123", email: "user@test.com", name: "Test", password: "hashed" },
      error: null,
    });

    const { validateCredentials } = await import("@/lib/auth-utils");
    const result = await validateCredentials("user@test.com", "password123");

    expect(result).toEqual({ id: "uuid-123", email: "user@test.com", name: "Test" });
  });

  it("returns null when user is not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const { validateCredentials } = await import("@/lib/auth-utils");
    const result = await validateCredentials("noone@test.com", "password123");

    expect(result).toBeNull();
  });

  it("returns null when password does not match", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    mockSingle.mockResolvedValue({
      data: { id: "uuid-123", email: "user@test.com", name: "Test", password: "hashed" },
      error: null,
    });

    const { validateCredentials } = await import("@/lib/auth-utils");
    const result = await validateCredentials("user@test.com", "wrongpassword");

    expect(result).toBeNull();
  });

  it("returns null when user has no password (OAuth-only account)", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "uuid-123", email: "user@test.com", name: "Test", password: null },
      error: null,
    });

    const { validateCredentials } = await import("@/lib/auth-utils");
    const result = await validateCredentials("user@test.com", "anypassword");

    expect(result).toBeNull();
  });
});

describe("createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a user and returns the record", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
    mockSingle.mockResolvedValue({
      data: { id: "uuid-456", email: "new@test.com", name: "Nuevo" },
      error: null,
    });

    const { createUser } = await import("@/lib/auth-utils");
    const result = await createUser("new@test.com", "password123", "Nuevo");

    expect(result).toEqual({ id: "uuid-456", email: "new@test.com", name: "Nuevo" });
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
  });

  it("returns null when email already exists", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);
    mockSingle.mockResolvedValue({ data: null, error: { message: "Duplicate email" } });

    const { createUser } = await import("@/lib/auth-utils");
    const result = await createUser("existing@test.com", "password123", "Duplicado");

    expect(result).toBeNull();
  });
});

describe("upsertOAuthUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the internal UUID for a new Google user", async () => {
    mockSingle.mockResolvedValue({ data: { id: "uuid-google-123" }, error: null });

    const { upsertOAuthUser } = await import("@/lib/auth-utils");
    const result = await upsertOAuthUser("google@gmail.com", "Google User");

    expect(result).toEqual({ id: "uuid-google-123" });
    expect(mockUpsert).toHaveBeenCalledWith(
      { email: "google@gmail.com", name: "Google User" },
      { onConflict: "email" }
    );
  });

  it("returns the existing UUID when the email is already registered", async () => {
    mockSingle.mockResolvedValue({ data: { id: "uuid-existing-456" }, error: null });

    const { upsertOAuthUser } = await import("@/lib/auth-utils");
    const result = await upsertOAuthUser("existing@gmail.com", "Usuario Existente");

    expect(result).toEqual({ id: "uuid-existing-456" });
  });

  it("accepts null as the name", async () => {
    mockSingle.mockResolvedValue({ data: { id: "uuid-noname-789" }, error: null });

    const { upsertOAuthUser } = await import("@/lib/auth-utils");
    const result = await upsertOAuthUser("noname@gmail.com", null);

    expect(result).toEqual({ id: "uuid-noname-789" });
    expect(mockUpsert).toHaveBeenCalledWith(
      { email: "noname@gmail.com", name: null },
      { onConflict: "email" }
    );
  });

  it("returns null when Supabase returns an error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { upsertOAuthUser } = await import("@/lib/auth-utils");
    const result = await upsertOAuthUser("fail@gmail.com", "Error User");

    expect(result).toBeNull();
  });
});
