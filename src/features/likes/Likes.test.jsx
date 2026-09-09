import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from "react-router";
import Likes from "./Likes";
import PostPage from "../posts/PostPage";
import usePost from "../posts/usePost";

vi.mock("../posts/usePost", () => ({ default: vi.fn() }));
vi.mock("../comments/Comments", () => ({ default: () => null }));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function renderPostPage() {
  usePost.mockImplementation((cuid) => ({
    post: {
      cuid, content: cuid, likeCount: 2,
      createdAt: "2026-09-08T12:00:00Z",
      author: { cuid: "author", name: "Author", picURL: "https://example.com/avatar.png" },
    },
    loading: false, error: null,
  }));
  const router = createMemoryRouter([
    { path: "/post/:postCuid", element: <PostPage /> },
  ], { initialEntries: ["/post/post-123"] });
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}

vi.mock("./LikeButton", () => ({
  default: function LikeButton({ likeCount, postCuid }) {
    return <button>Like {postCuid} ({likeCount})</button>;
  },
}));

const likes = [
  { user: { cuid: "user-1", name: "Michael" } },
  { user: { cuid: "user-2", name: "Alex" } },
];
const errorMessage = "A network error was encountered";

function jsonResponse(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

function renderLikes(likeCount = 2) {
  render(
    <MemoryRouter initialEntries={["/post/post-123"]}>
      <Routes>
        <Route path="/post/:postCuid" element={<Likes likeCount={likeCount} />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

describe("Likes", () => {
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

  it.each([1, 3])("passes the route and count %i to LikeButton and shows Show Likes", (count) => {
    renderLikes(count);

    expect(screen.getByRole("button", { name: `Like post-123 (${count})` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Likes" })).toBeInTheDocument();
    expect(screen.queryByText("Users Liked:")).not.toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps LikeButton but hides Show Likes when the count is zero", () => {
    renderLikes(0);

    expect(screen.getByRole("button", { name: "Like post-123 (0)" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show Likes" })).not.toBeInTheDocument();
    expect(screen.queryByText("Users Liked:")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests the route's likes with credentials and keeps the list hidden while pending", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const user = renderLikes();

    await user.click(screen.getByRole("button", { name: "Show Likes" }));

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://api.example.com/v1/posts/post-123/likes",
      { method: "GET", credentials: "include", signal: expect.any(AbortSignal) },
    );
    expect(screen.queryByText("Users Liked:")).not.toBeInTheDocument();
  });

  it("displays the returned users after success and hides Show Likes", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ likes }));
    const user = renderLikes();

    await user.click(screen.getByRole("button", { name: "Show Likes" }));

    expect(await screen.findByText("Users Liked:")).toBeInTheDocument();
    for (const like of likes) {
      expect(screen.getByRole("link", { name: like.user.name })).toHaveAttribute(
        "href", `/profile/${like.user.cuid}`,
      );
    }
    expect(screen.getAllByRole("link")).toHaveLength(likes.length);
    expect(screen.queryByRole("button", { name: "Show Likes" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Like post-123 (2)" })).toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  it("handles an empty likes array without crashing", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ likes: [] }));
    const user = renderLikes();

    await user.click(screen.getByRole("button", { name: "Show Likes" }));

    expect(await screen.findByText("Users Liked:")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Show Likes" })).not.toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  it.each([401, 404, 500])("handles HTTP %i without rendering the users list", async (status) => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status, json });
    const user = renderLikes();

    await user.click(screen.getByRole("button", { name: "Show Likes" }));

    expect(await screen.findByRole("heading", { name: errorMessage })).toBeInTheDocument();
    expect(screen.queryByText("Users Liked:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Likes" })).toBeEnabled();
    expect(json).not.toHaveBeenCalled();
  });

  it.each(["network", "JSON parsing"])("handles a %s failure without crashing and allows retry", async (failure) => {
    if (failure === "network") {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    } else {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError("Invalid JSON")),
      });
    }
    const user = renderLikes();

    await user.click(screen.getByRole("button", { name: "Show Likes" }));

    expect(await screen.findByRole("heading", { name: errorMessage })).toBeInTheDocument();
    expect(screen.queryByText("Users Liked:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Likes" })).toBeEnabled();
  });

  it("clears the previous error when retrying and displays a successful result", async () => {
    let resolveRetry;
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockReturnValueOnce(new Promise((resolve) => { resolveRetry = resolve; }));
    const user = renderLikes();

    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.queryByText("Users Liked:")).not.toBeInTheDocument();

    await act(async () => {
      resolveRetry(jsonResponse({ likes }));
    });

    expect(screen.getByRole("link", { name: "Michael" })).toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show Likes" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("prevents duplicate requests during fetching and JSON parsing", async () => {
    const request = deferred();
    const body = deferred();
    fetchMock.mockReturnValue(request.promise);
    const user = renderLikes();
    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    const button = screen.getByRole("button", { name: "Loading likes..." });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => request.resolve({ ok: true, json: () => body.promise }));
    expect(button).toBeDisabled();
    await user.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => body.resolve({ likes }));
    expect(screen.getByRole("link", { name: "Michael" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Loading likes..." })).not.toBeInTheDocument();
  });

  it.each([null, {}, { likes: null }, { likes: {} }])("handles malformed data %j and allows retry", async (data) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(data)).mockResolvedValueOnce(jsonResponse({ likes }));
    const user = renderLikes();
    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText("Users Liked:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Likes" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    expect(await screen.findByRole("link", { name: "Michael" })).toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  it("aborts the request on unmount", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    const { unmount } = renderPostPage();
    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    const signal = fetchMock.mock.calls[0][1].signal;
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("ignores AbortError and restores the request button", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    const user = renderLikes();
    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    expect(await screen.findByRole("button", { name: "Show Likes" })).toBeEnabled();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  it.each(["success", "error"])("resets the previous post's %s state on navigation", async (outcome) => {
    if (outcome === "success") fetchMock.mockResolvedValueOnce(jsonResponse({ likes }));
    else fetchMock.mockRejectedValueOnce(new Error("Offline"));
    const user = userEvent.setup();
    const { router } = renderPostPage();
    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    expect(await screen.findByText(outcome === "success" ? "Users Liked:" : errorMessage)).toBeInTheDocument();
    await act(async () => router.navigate("/post/post-456"));
    expect(screen.queryByText("Users Liked:")).not.toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Likes" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Like post-456 (2)" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["success", "error"])("ignores old JSON's late %s while another post's likes load", async (outcome) => {
    const oldBody = deferred();
    const nextRequest = deferred();
    const json = vi.fn(() => oldBody.promise);
    fetchMock.mockResolvedValueOnce({ ok: true, json }).mockReturnValueOnce(nextRequest.promise);
    const user = userEvent.setup();
    const { router } = renderPostPage();
    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    await waitFor(() => expect(json).toHaveBeenCalledOnce());
    const oldSignal = fetchMock.mock.calls[0][1].signal;
    await act(async () => router.navigate("/post/post-456"));
    expect(oldSignal.aborted).toBe(true);
    await user.click(screen.getByRole("button", { name: "Show Likes" }));
    expect(fetchMock).toHaveBeenLastCalledWith("https://api.example.com/v1/posts/post-456/likes", {
      method: "GET", credentials: "include", signal: expect.any(AbortSignal),
    });
    await act(async () => {
      if (outcome === "success") oldBody.resolve({ likes });
      else oldBody.reject(new Error("Late failure"));
    });
    expect(screen.getByRole("button", { name: "Loading likes..." })).toBeDisabled();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Michael" })).not.toBeInTheDocument();
    await act(async () => nextRequest.resolve(jsonResponse({ likes: [{ user: { cuid: "new-user", name: "New user" } }] })));
    expect(screen.getByRole("link", { name: "New user" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Michael" })).not.toBeInTheDocument();
  });
});
