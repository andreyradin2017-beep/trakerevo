import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. Создаем общие моки через vi.hoisted, чтобы они были доступны везде
const { sharedMockRequest, sharedMockDbGet } = vi.hoisted(() => ({
  sharedMockRequest: vi
    .fn()
    .mockImplementation(() => Promise.resolve({ data: { success: true } })),
  sharedMockDbGet: vi.fn(),
}));

// 2. Мокаем axios
vi.mock("axios", async (importActual) => {
  const actual = await importActual<typeof import("axios")>();
  return {
    default: {
      ...actual,
      create: vi.fn(() => ({
        request: sharedMockRequest,
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
      })),
      isAxiosError: vi.fn((err: any) => err?.isAxiosError === true),
    },
  };
});

// 3. Мокаем базу данных
vi.mock("../db/db", () => ({
  db: {
    settings: {
      get: sharedMockDbGet,
    },
  },
}));

// 4. Импортируем тестируемые клиенты
import { tmdbClient, rawgClient } from "../services/apiClient";

describe("ApiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sharedMockRequest.mockReset();
    // Возвращаем дефолтный ответ
    sharedMockRequest.mockImplementation(() =>
      Promise.resolve({ data: { success: true } }),
    );
    sharedMockDbGet.mockReset();
  });

  it("should add api_key for TMDB requests from DB", async () => {
    sharedMockDbGet.mockResolvedValue({ value: "db_key" });

    const result = await tmdbClient.get("/test", { settingsKey: "tmdb_key" });

    expect(sharedMockDbGet).toHaveBeenCalledWith("tmdb_key");
    expect(sharedMockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ api_key: "db_key" }),
      }),
    );
    expect(result).toEqual({ success: true });
  });

  it("should add key for RAWG requests from DB", async () => {
    sharedMockDbGet.mockResolvedValue({ value: "rawg_db_key" });

    await rawgClient.get("/games", { settingsKey: "rawg_key" });

    expect(sharedMockDbGet).toHaveBeenCalledWith("rawg_key");
    expect(sharedMockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ key: "rawg_db_key" }),
      }),
    );
  });

  it("should return null on request failure", async () => {
    sharedMockRequest.mockRejectedValue(new Error("Network Error"));

    const result = await tmdbClient.get("/fail");

    expect(result).toBeNull();
  });

  it("should handle axios errors silently and return null", async () => {
    const error = new Error("404 Not Found");
    (error as any).isAxiosError = true;
    (error as any).response = { status: 404 };

    sharedMockRequest.mockRejectedValue(error);

    const result = await tmdbClient.get("/404");

    expect(result).toBeNull();
  });
});
