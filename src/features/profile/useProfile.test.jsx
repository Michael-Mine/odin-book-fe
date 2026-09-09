import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import useProfile from "./useProfile";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function profileResponse(user) {
  return { ok: true, json: () => Promise.resolve({ user }) };
}

describe("useProfile", () => {
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

  it("starts with no profile or error while loading", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useProfile("user-1"));

    expect(result.current).toEqual({
      userProfile: null,
      error: null,
      loading: true,
    });
  });

  it("requests the specified user with credentials and an abort signal", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderHook(() => useProfile("user-1"));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/users/user-1",
      {
        method: "GET",
        credentials: "include",
        signal: expect.any(AbortSignal),
      },
    );
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });

  it("stores response.user and finishes loading after success", async () => {
    const user = { cuid: "user-1", name: "Michael" };
    const request = deferred();
    fetchMock.mockReturnValue(request.promise);
    const { result } = renderHook(() => useProfile("user-1"));

    expect(result.current.loading).toBe(true);
    await act(async () => request.resolve(profileResponse(user)));

    expect(result.current).toEqual({
      userProfile: user,
      error: null,
      loading: false,
    });
  });

  it("accepts a null user response", async () => {
    fetchMock.mockResolvedValue(profileResponse(null));
    const { result } = renderHook(() => useProfile("user-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userProfile).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it.each([401, 404, 500])("handles HTTP status %i as an error", async (status) => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status, json });
    const { result } = renderHook(() => useProfile("user-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userProfile).toBeNull();
    expect(result.current.error).toEqual(new Error(`Response status: ${status}`));
    expect(json).not.toHaveBeenCalled();
  });

  it("stores a network error and finishes loading", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);
    const { result } = renderHook(() => useProfile("user-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userProfile).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("stores a JSON parsing error and finishes loading", async () => {
    const error = new SyntaxError("Invalid JSON");
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(error),
    });
    const { result } = renderHook(() => useProfile("user-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userProfile).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("ignores AbortError", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    const { result } = renderHook(() => useProfile("user-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.userProfile).toBeNull();
  });

  it("aborts the request on unmount", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => useProfile("user-1"));
    const signal = fetchMock.mock.calls[0][1].signal;

    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("does not fetch again when the userCuid is unchanged", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { rerender } = renderHook(({ cuid }) => useProfile(cuid), {
      initialProps: { cuid: "user-1" },
    });

    rerender({ cuid: "user-1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });

  it.each(["success", "error"])(
    "resets state when switching users after a previous %s",
    async (outcome) => {
      if (outcome === "success") {
        fetchMock.mockResolvedValueOnce(profileResponse({ cuid: "user-1" }));
      } else {
        fetchMock.mockRejectedValueOnce(new Error("Previous request failed"));
      }
      const nextRequest = deferred();
      fetchMock.mockReturnValueOnce(nextRequest.promise);
      const { result, rerender } = renderHook(({ cuid }) => useProfile(cuid), {
        initialProps: { cuid: "user-1" },
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      const oldSignal = fetchMock.mock.calls[0][1].signal;
      rerender({ cuid: "user-2" });

      expect(oldSignal.aborted).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenLastCalledWith(
        "https://api.example.com/v1/users/user-2",
        {
          method: "GET",
          credentials: "include",
          signal: expect.any(AbortSignal),
        },
      );
      expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(false);
      expect(result.current).toEqual({
        userProfile: null,
        error: null,
        loading: true,
      });

      const user = { cuid: "user-2", name: "New user" };
      await act(async () => nextRequest.resolve(profileResponse(user)));
      expect(result.current).toEqual({
        userProfile: user,
        error: null,
        loading: false,
      });
    },
  );

  it.each(["success", "error"])(
    "ignores an old request's late %s while the new request is loading",
    async (outcome) => {
      const oldRequest = deferred();
      const nextRequest = deferred();
      fetchMock
        .mockReturnValueOnce(oldRequest.promise)
        .mockReturnValueOnce(nextRequest.promise);
      const { result, rerender } = renderHook(({ cuid }) => useProfile(cuid), {
        initialProps: { cuid: "user-1" },
      });

      rerender({ cuid: "user-2" });
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
      await act(async () => {
        if (outcome === "success") {
          oldRequest.resolve(profileResponse({ cuid: "user-1" }));
        } else {
          oldRequest.reject(new Error("Late network failure"));
        }
      });

      expect(result.current).toEqual({
        userProfile: null,
        error: null,
        loading: true,
      });
      const user = { cuid: "user-2" };
      await act(async () => nextRequest.resolve(profileResponse(user)));
      expect(result.current).toEqual({
        userProfile: user,
        error: null,
        loading: false,
      });
    },
  );

  it("does not overwrite the new profile when old JSON finishes late", async () => {
    const oldJson = deferred();
    const json = vi.fn(() => oldJson.promise);
    const user = { cuid: "user-2" };
    fetchMock
      .mockResolvedValueOnce({ ok: true, json })
      .mockResolvedValueOnce(profileResponse(user));
    const { result, rerender } = renderHook(({ cuid }) => useProfile(cuid), {
      initialProps: { cuid: "user-1" },
    });

    await waitFor(() => expect(json).toHaveBeenCalledOnce());
    rerender({ cuid: "user-2" });
    await waitFor(() => expect(result.current.userProfile).toEqual(user));
    await act(async () => oldJson.resolve({ user: { cuid: "user-1" } }));

    expect(result.current).toEqual({
      userProfile: user,
      error: null,
      loading: false,
    });
  });
});
