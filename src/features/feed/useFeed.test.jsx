import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import useFeed from "./useFeed";

describe("useFeed", () => {
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

  it("starts with no feed or error while the request is pending", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useFeed());

    expect(result.current.feed).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("requests the feed with credentials and an abort signal", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    renderHook(() => useFeed());

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/posts/feed",
      {
        method: "GET",
        credentials: "include",
        signal: expect.any(AbortSignal),
      },
    );
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });

  it("stores the whole feed response and finishes loading after success", async () => {
    const feed = {
      posts: [{ cuid: "post-1", content: "Hello" }],
      nextCursor: "post-1",
    };
    let resolveRequest;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { result } = renderHook(() => useFeed());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveRequest({
        ok: true,
        json: () => Promise.resolve(feed),
      });
    });

    expect(result.current.feed).toEqual(feed);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("stores an empty feed as a successful response", async () => {
    const feed = { posts: [], nextCursor: null };
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(feed),
    });

    const { result } = renderHook(() => useFeed());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.feed).toEqual(feed);
    expect(result.current.error).toBeNull();
  });

  it.each([401, 500])(
    "stores an error and finishes loading for HTTP status %i",
    async (status) => {
      const json = vi.fn();
      fetchMock.mockResolvedValue({ ok: false, status, json });

      const { result } = renderHook(() => useFeed());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.feed).toBeNull();
      expect(result.current.error).toEqual(
        new Error(`Response status: ${status}`),
      );
      expect(json).not.toHaveBeenCalled();
    },
  );

  it("stores a network error and finishes loading", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);

    const { result } = renderHook(() => useFeed());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.feed).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("stores a JSON parsing error and finishes loading", async () => {
    const error = new SyntaxError("Invalid JSON");
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(error),
    });

    const { result } = renderHook(() => useFeed());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.feed).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("ignores an AbortError", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    const { result } = renderHook(() => useFeed());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.feed).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("aborts the pending feed request when unmounted", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useFeed());
    const signal = fetchMock.mock.calls[0][1].signal;

    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
