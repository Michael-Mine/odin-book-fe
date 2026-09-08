import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import useComments from "./useComments";
import Comments from "./Comments";

vi.mock("./useComments", () => ({ default: vi.fn() }));

vi.mock("./WriteComment", () => ({
  default: function WriteComment() {
    return <section aria-label="Write a comment">Comment form</section>;
  },
}));

const comments = [
  {
    cuid: "comment-1",
    content: "The first comment",
    createdAt: "2026-09-08T12:00:00.000Z",
    author: {
      cuid: "author-1",
      name: "Michael",
      picURL: "https://example.com/michael.png",
    },
  },
  {
    cuid: "comment-2",
    content: "The second comment",
    createdAt: "2026-09-08T13:00:00.000Z",
    author: {
      cuid: "author-2",
      name: "Alex",
      picURL: "https://example.com/alex.png",
    },
  },
];

function renderComments(postCuid = "post-1") {
  return render(
    <MemoryRouter initialEntries={[`/post/${postCuid}`]}>
      <Routes>
        <Route path="/post/:postCuid" element={<Comments />} />
      </Routes>
    </MemoryRouter>,
  );
}

function expectCommentsHidden() {
  expect(screen.queryByRole("heading", { name: "Comments" })).not.toBeInTheDocument();
  for (const comment of comments) {
    expect(screen.queryByText(comment.content)).not.toBeInTheDocument();
  }
  expect(screen.queryByRole("region", { name: "Write a comment" })).not.toBeInTheDocument();
  expect(screen.queryByText("No comments yet")).not.toBeInTheDocument();
}

describe("Comments", () => {
  beforeEach(() => {
    useComments.mockReset();
    useComments.mockReturnValue({ comments, error: null, loading: false });
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    { comments: null, error: null },
    { comments, error: new Error("Previous request failed") },
  ])("shows loading before comments or errors: %o", (state) => {
    useComments.mockReturnValue({ ...state, loading: true });
    renderComments();

    expect(screen.getByRole("heading", { name: "Loading..." })).toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
    expectCommentsHidden();
  });

  it.each([null, comments])("shows an error instead of comments and the form: %o", (currentComments) => {
    useComments.mockReturnValue({
      comments: currentComments,
      error: new Error("Failed to fetch"),
      loading: false,
    });
    renderComments();

    expect(screen.getByRole("heading", { name: "A network error was encountered" })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expectCommentsHidden();
  });

  it("passes the route postCuid to useComments", () => {
    renderComments("another-post");

    expect(useComments).toHaveBeenCalledWith("another-post");
  });

  it("renders the heading, each returned comment, and the writing form", () => {
    renderComments();

    expect(screen.getByRole("heading", { name: "Comments", level: 3 })).toBeInTheDocument();
    for (const comment of comments) {
      expect(screen.getByText(comment.content)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: comment.author.name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("link")).toHaveLength(comments.length);
    expect(screen.getByRole("region", { name: "Write a comment" })).toBeInTheDocument();
    expect(screen.queryByText("No comments yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
  });

  it("shows no comments yet and keeps the writing form when the collection is empty", () => {
    useComments.mockReturnValue({ comments: [], error: null, loading: false });
    renderComments();

    expect(screen.getByRole("heading", { name: "Comments" })).toBeInTheDocument();
    expect(screen.getByText("No comments yet")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Write a comment" })).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
  });
});
