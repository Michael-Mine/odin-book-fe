import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import Likes from "./Likes";

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
      { method: "GET", credentials: "include" },
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
});
