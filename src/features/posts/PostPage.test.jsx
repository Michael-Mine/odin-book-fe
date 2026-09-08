import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import usePost from "./usePost";
import PostPage from "./PostPage";

vi.mock("./usePost", () => ({ default: vi.fn() }));

vi.mock("../likes/Likes", () => ({
  default: function Likes({ likeCount }) {
    return <section aria-label="Likes">Like count: {likeCount}</section>;
  },
}));

vi.mock("../comments/Comments", () => ({
  default: function Comments() {
    return <section aria-label="Comments">Comments component</section>;
  },
}));

const post = {
  cuid: "post-1",
  content: "A post for the page test",
  createdAt: "2026-09-08T12:00:00.000Z",
  likeCount: 3,
  author: {
    cuid: "author-1",
    name: "Michael",
    picURL: "https://example.com/avatar.png",
  },
};

function renderPage(postCuid = post.cuid) {
  return render(
    <MemoryRouter initialEntries={[`/post/${postCuid}`]}>
      <Routes>
        <Route path="/post/:postCuid" element={<PostPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function expectPostContentHidden() {
  expect(screen.queryByText(post.content)).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: post.author.name })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Likes" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Comments" })).not.toBeInTheDocument();
}

describe("PostPage", () => {
  beforeEach(() => {
    usePost.mockReset();
    usePost.mockReturnValue({ post, error: null, loading: false });
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    { post: null, error: null },
    { post, error: new Error("Previous request failed") },
  ])("shows loading before post content or errors: %o", (state) => {
    usePost.mockReturnValue({ ...state, loading: true });
    renderPage();

    expect(screen.getByRole("heading", { name: "Loading..." })).toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
    expect(screen.queryByText("Post not found")).not.toBeInTheDocument();
    expectPostContentHidden();
  });

  it.each([null, post])("shows an error instead of post content (post: %o)", (currentPost) => {
    usePost.mockReturnValue({
      post: currentPost,
      error: new Error("Response status: 404"),
      loading: false,
    });
    renderPage();

    expect(screen.getByRole("heading", { name: "A network error was encountered" })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText("Post not found")).not.toBeInTheDocument();
    expectPostContentHidden();
  });

  it("shows post not found when loading finishes without a post or error", () => {
    usePost.mockReturnValue({ post: null, error: null, loading: false });
    renderPage();

    expect(screen.getByRole("heading", { name: "Post not found" })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
    expectPostContentHidden();
  });

  it("passes the route postCuid to usePost", () => {
    renderPage("another-post");

    expect(usePost).toHaveBeenCalledWith("another-post");
  });

  it("renders the post heading, content, and author header", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Michael's Post" })).toBeInTheDocument();
    expect(screen.getByText(post.content)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Michael" })).toHaveAttribute("href", "/profile/author-1");
    expect(screen.getByRole("img", { name: "profile pic" })).toHaveAttribute("src", post.author.picURL);
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
    expect(screen.queryByText("Post not found")).not.toBeInTheDocument();
  });

  it.each([0, 3])("passes a like count of %i to Likes and renders Comments", (likeCount) => {
    usePost.mockReturnValue({ post: { ...post, likeCount }, error: null, loading: false });
    renderPage();

    expect(screen.getByRole("region", { name: "Likes" })).toHaveTextContent(`Like count: ${likeCount}`);
    expect(screen.getByRole("region", { name: "Comments" })).toBeInTheDocument();
  });
});
