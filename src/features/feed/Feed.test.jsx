import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Feed from "./Feed";

vi.mock("./FeedItem", () => ({
  default: ({ post }) => <article>{post.content}</article>,
}));

const firstPost = { cuid: "post-1", content: "First post" };
const secondPost = { cuid: "post-2", content: "Second post" };
const thirdPost = { cuid: "post-3", content: "Third post" };
const firstPage = { posts: [firstPost], nextCursor: "cursor-1" };
const response = (page) => ({
  ok: true,
  json: () => Promise.resolve(page),
});

describe("Feed", () => {
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

  it("shows loading while the initial request is pending", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<Feed />);

    expect(screen.getByRole("heading", { name: "Loading..." })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows an error when the initial request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<Feed />);

    expect(await screen.findByRole("heading", {
      name: "A network error was encountered",
    })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Loading..." })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the heading and posts in response order", async () => {
    fetchMock.mockResolvedValue(response({
      posts: [firstPost, secondPost],
      nextCursor: null,
    }));
    render(<Feed />);

    expect(await screen.findByRole("heading", { name: "Home Feed" })).toBeInTheDocument();
    expect(screen.getAllByRole("article").map((post) => post.textContent))
      .toEqual(["First post", "Second post"]);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Loading..." })).not.toBeInTheDocument();
  });

  it("renders an empty feed without a pagination button", async () => {
    fetchMock.mockResolvedValue(response({ posts: [], nextCursor: null }));
    render(<Feed />);

    expect(await screen.findByRole("heading", { name: "Home Feed" })).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("appends pages, uses the updated cursor, and hides the button after the final page", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(response(firstPage))
      .mockResolvedValueOnce(response({ posts: [secondPost], nextCursor: "cursor-2" }))
      .mockResolvedValueOnce(response({ posts: [thirdPost], nextCursor: null }));
    render(<Feed />);

    await user.click(await screen.findByRole("button", { name: "Show More Posts" }));
    expect(await screen.findByText("Second post")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(2,
      "https://api.example.com/v1/posts/feed?cursor=cursor-1",
      { method: "GET", credentials: "include" },
    );
    expect(screen.getAllByRole("article").map((post) => post.textContent))
      .toEqual(["First post", "Second post"]);

    await user.click(screen.getByRole("button", { name: "Show More Posts" }));
    expect(await screen.findByText("Third post")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(3,
      "https://api.example.com/v1/posts/feed?cursor=cursor-2",
      { method: "GET", credentials: "include" },
    );
    expect(screen.getAllByRole("article").map((post) => post.textContent))
      .toEqual(["First post", "Second post", "Third post"]);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps posts visible and prevents duplicate requests while loading more", async () => {
    const user = userEvent.setup();
    let resolvePage;
    fetchMock.mockResolvedValueOnce(response(firstPage)).mockReturnValueOnce(
      new Promise((resolve) => { resolvePage = resolve; }),
    );
    render(<Feed />);

    await user.click(await screen.findByRole("button", { name: "Show More Posts" }));
    const button = screen.getByRole("button", { name: "Loading more posts..." });
    expect(button).toBeDisabled();
    expect(screen.getByText("First post")).toBeInTheDocument();
    await user.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolvePage(response({ posts: [secondPost], nextCursor: "cursor-2" }));
    });
    expect(screen.getByText("Second post")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show More Posts" })).toBeEnabled();
  });

  it.each(["HTTP error", "network rejection", "invalid JSON"])(
    "preserves posts and allows retry after pagination fails with %s",
    async (failure) => {
      const user = userEvent.setup();
      fetchMock.mockResolvedValueOnce(response(firstPage));
      if (failure === "HTTP error") {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      } else if (failure === "network rejection") {
        fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      } else {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.reject(new SyntaxError("Invalid JSON")),
        });
      }
      let resolveRetry;
      fetchMock.mockReturnValueOnce(new Promise((resolve) => { resolveRetry = resolve; }));
      render(<Feed />);

      await user.click(await screen.findByRole("button", { name: "Show More Posts" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Could not load more posts. Please try again.",
      );
      expect(screen.getByText("First post")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();

      await user.click(screen.getByRole("button", { name: "Try again" }));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Loading more posts..." })).toBeDisabled();
      expect(screen.getByText("First post")).toBeInTheDocument();
      expect(fetchMock).toHaveBeenNthCalledWith(3,
        "https://api.example.com/v1/posts/feed?cursor=cursor-1",
        { method: "GET", credentials: "include" },
      );

      await act(async () => {
        resolveRetry(response({ posts: [secondPost], nextCursor: null }));
      });
      expect(screen.getAllByRole("article").map((post) => post.textContent))
        .toEqual(["First post", "Second post"]);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    },
  );
});
