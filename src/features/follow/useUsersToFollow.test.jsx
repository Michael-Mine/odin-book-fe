import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import useUsersToFollow from "./useUsersToFollow";

describe("useUsersToFollow", () => {
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

  it("starts with no users or error while the request is pending", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useUsersToFollow());

    expect(result.current.usersToFollow).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("requests users to follow with credentials and an abort signal", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    renderHook(() => useUsersToFollow());

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/users",
      {
        method: "GET",
        credentials: "include",
        signal: expect.any(AbortSignal),
      },
    );
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });

  it("stores the users from the response and finishes loading after success", async () => {
    const users = [{ cuid: "user-1", name: "Michael", picURL: "https://example.com/avatar.png" }];
    let resolveRequest;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { result } = renderHook(() => useUsersToFollow());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveRequest({
        ok: true,
        json: () => Promise.resolve({ users }),
      });
    });

    expect(result.current.usersToFollow).toEqual(users);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("stores an empty users list as a successful response", async () => {
    const users = [];
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users }),
    });

    const { result } = renderHook(() => useUsersToFollow());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usersToFollow).toEqual(users);
    expect(result.current.error).toBeNull();
  });

  it.each([401, 500])(
    "stores an error and finishes loading for HTTP status %i",
    async (status) => {
      const json = vi.fn();
      fetchMock.mockResolvedValue({ ok: false, status, json });

      const { result } = renderHook(() => useUsersToFollow());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.usersToFollow).toBeNull();
      expect(result.current.error).toEqual(
        new Error(`Response status: ${status}`),
      );
      expect(json).not.toHaveBeenCalled();
    },
  );

  it("stores a network error and finishes loading", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);

    const { result } = renderHook(() => useUsersToFollow());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usersToFollow).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("stores a JSON parsing error and finishes loading", async () => {
    const error = new SyntaxError("Invalid JSON");
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(error),
    });

    const { result } = renderHook(() => useUsersToFollow());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usersToFollow).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("ignores an AbortError", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    const { result } = renderHook(() => useUsersToFollow());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usersToFollow).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("aborts the pending request when unmounted", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useUsersToFollow());
    const signal = fetchMock.mock.calls[0][1].signal;

    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
