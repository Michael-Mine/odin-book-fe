import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import useUser from "./useUser";

describe("useUser", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_API_URL", "https://api.example.com/");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("starts with no user or error while the session request is pending", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useUser());

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("requests the session with credentials and an abort signal", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    renderHook(() => useUser());

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/auth/session",
      {
        method: "GET",
        credentials: "include",
        signal: expect.any(AbortSignal),
      },
    );
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });

  it("stores the returned user and finishes loading after success", async () => {
    const user = { cuid: "user-1", name: "Michael" };
    let resolveRequest;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { result } = renderHook(() => useUser());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveRequest({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user }),
      });
    });

    expect(result.current.user).toEqual(user);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("treats a 401 as logged out without setting an error", async () => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status: 401, json });

    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
    expect(json).not.toHaveBeenCalled();
  });

  it("stores an error and finishes loading for a server error", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.error).toEqual(new Error("Response status: 500"));
  });

  it("stores a network error and finishes loading", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);

    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it.each([{}, { user: null }])(
    "keeps the user null when the successful response is %j",
    async (response) => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(response),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    },
  );

  it("stores a JSON parsing error and finishes loading", async () => {
    const error = new SyntaxError("Invalid JSON");
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(error),
    });

    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("ignores an AbortError", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("aborts the pending session request when unmounted", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useUser());
    const signal = fetchMock.mock.calls[0][1].signal;

    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
