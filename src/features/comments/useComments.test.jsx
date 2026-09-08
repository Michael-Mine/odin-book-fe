import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import useComments from "./useComments";

describe("useComments", () => {
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

  it("starts with no comments or error while the request is pending", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useComments("post-1"));

    expect(result.current).toEqual({ comments: null, error: null, loading: true });
  });

  it("requests the post's comments with credentials and an abort signal", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderHook(() => useComments("post-1"));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/posts/post-1/comments",
      {
        method: "GET",
        credentials: "include",
        signal: expect.any(AbortSignal),
      },
    );
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });

  it.each([
    { label: "returned comments", comments: [{ cuid: "comment-1", content: "Hello" }] },
    { label: "an empty collection", comments: [] },
  ])("stores $label and finishes loading", async ({ comments }) => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ comments }),
    });
    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toEqual(comments);
    expect(result.current.error).toBeNull();
  });

  it.each([401, 404, 500])("handles HTTP %i as an error", async (status) => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status, json });
    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toBeNull();
    expect(result.current.error).toEqual(new Error(`Response status: ${status}`));
    expect(json).not.toHaveBeenCalled();
  });

  it("stores a network error and finishes loading", async () => {
    const error = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(error);
    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("stores a JSON parsing error and finishes loading", async () => {
    const error = new SyntaxError("Invalid JSON");
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.reject(error) });
    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it("ignores an AbortError", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    const { result } = renderHook(() => useComments("post-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("aborts the pending request on unmount", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => useComments("post-1"));
    const signal = fetchMock.mock.calls[0][1].signal;

    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it.each(["success", "failure"])(
    "resets state and loads the new post's comments after %s",
    async (previousOutcome) => {
      const previousComments = [{ cuid: "old-comment", content: "Old" }];
      const nextComments = [{ cuid: "new-comment", content: "New" }];
      const error = new Error("Previous request failed");
      if (previousOutcome === "success") {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ comments: previousComments }),
        });
      } else {
        fetchMock.mockRejectedValueOnce(error);
      }
      let resolveNext;
      fetchMock.mockReturnValueOnce(new Promise((resolve) => {
        resolveNext = resolve;
      }));
      const { result, rerender } = renderHook(({ postCuid }) => useComments(postCuid), {
        initialProps: { postCuid: "post-1" },
      });
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.comments).toEqual(previousOutcome === "success" ? previousComments : null);
      expect(result.current.error).toBe(previousOutcome === "failure" ? error : null);

      rerender({ postCuid: "post-2" });

      expect(result.current).toEqual({ comments: null, error: null, loading: true });
      expect(fetchMock).toHaveBeenLastCalledWith(
        "https://api.example.com/v1/posts/post-2/comments",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );

      await act(async () => {
        resolveNext({ ok: true, json: () => Promise.resolve({ comments: nextComments }) });
      });
      expect(result.current).toEqual({ comments: nextComments, error: null, loading: false });
    },
  );

  it("aborts the old pending request without ending loading for the new one", async () => {
    fetchMock.mockImplementation((_url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      });
    }));
    const { result, rerender } = renderHook(({ postCuid }) => useComments(postCuid), {
      initialProps: { postCuid: "post-1" },
    });
    const oldSignal = fetchMock.mock.calls[0][1].signal;

    await act(async () => rerender({ postCuid: "post-2" }));

    expect(oldSignal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api.example.com/v1/posts/post-2/comments",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(false);
    expect(result.current).toEqual({ comments: null, error: null, loading: true });
  });
});
