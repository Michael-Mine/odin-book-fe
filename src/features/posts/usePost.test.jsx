import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import usePost from "./usePost";

describe("usePost", () => {
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

  it("starts with no post or error while the request is pending", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePost("post-1"));

    expect(result.current).toEqual({ post: null, error: null, loading: true });
  });

  it("requests the specified post with credentials and an abort signal", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderHook(() => usePost("post-1"));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/posts/post-1",
      {
        method: "GET",
        credentials: "include",
        signal: expect.any(AbortSignal),
      },
    );
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });

  it("stores the nested post and finishes loading after success", async () => {
    const post = { cuid: "post-1", content: "Hello" };
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ post }),
    });
    const { result } = renderHook(() => usePost("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.post).toEqual(post);
    expect(result.current.error).toBeNull();
  });

  it.each([401, 404, 500])("handles HTTP %i as an error", async (status) => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status, json });
    const { result } = renderHook(() => usePost("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.post).toBeNull();
    expect(result.current.error).toEqual(new Error(`Response status: ${status}`));
    expect(json).not.toHaveBeenCalled();
  });

  it("stores a network error and finishes loading", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);
    const { result } = renderHook(() => usePost("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.post).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("stores a JSON parsing error and finishes loading", async () => {
    const error = new SyntaxError("Invalid JSON");
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.reject(error) });
    const { result } = renderHook(() => usePost("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.post).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("ignores an AbortError", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    const { result } = renderHook(() => usePost("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.post).toBeNull();
  });

  it("aborts the pending request on unmount", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => usePost("post-1"));
    const signal = fetchMock.mock.calls[0][1].signal;

    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("aborts the old request without ending loading for the new request", async () => {
    fetchMock.mockImplementation((_url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      });
    }));
    const { result, rerender } = renderHook(({ cuid }) => usePost(cuid), {
      initialProps: { cuid: "post-1" },
    });
    const oldSignal = fetchMock.mock.calls[0][1].signal;

    await act(async () => rerender({ cuid: "post-2" }));

    expect(oldSignal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api.example.com/v1/posts/post-2",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("resets loading when requesting another post after success", async () => {
    const firstPost = { cuid: "post-1" };
    const nextPost = { cuid: "post-2" };
    let resolveNext;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ post: firstPost }),
    }).mockReturnValueOnce(new Promise((resolve) => { resolveNext = resolve; }));
    const { result, rerender } = renderHook(({ cuid }) => usePost(cuid), {
      initialProps: { cuid: "post-1" },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ cuid: "post-2" });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveNext({ ok: true, json: () => Promise.resolve({ post: nextPost }) });
    });
    expect(result.current.post).toEqual(nextPost);
    expect(result.current.loading).toBe(false);
  });

  it("clears the previous error when requesting another post", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockReturnValueOnce(new Promise(() => {}));
    const { result, rerender } = renderHook(({ cuid }) => usePost(cuid), {
      initialProps: { cuid: "post-1" },
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    rerender({ cuid: "post-2" });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
  });
});
