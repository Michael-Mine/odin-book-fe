import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import FeedItem from "./FeedItem";

vi.mock("../posts/PostHeader", () => ({
  default: ({ post }) => <h2>{post.author.name}</h2>,
}));

vi.mock("../likes/LikeButton", () => ({
  default: ({ likeCount, postCuid }) => (
    <button data-post-cuid={postCuid}>{likeCount} Likes</button>
  ),
}));

const post = {
  cuid: "post-123",
  content: "Hello from the feed",
  author: { name: "Alex" },
  likeCount: 4,
  commentCount: 3,
};

function renderFeedItem(overrides = {}) {
  return render(
    <MemoryRouter>
      <FeedItem post={{ ...post, ...overrides }} />
    </MemoryRouter>,
  );
}

describe("FeedItem", () => {
  it.each([199, 200])(
    "shows all %i characters without an expansion button",
    (length) => {
      const content = "a".repeat(length);
      renderFeedItem({ content });

      expect(screen.getByText(content, { exact: true })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "See more" }),
      ).not.toBeInTheDocument();
    },
  );

  it("truncates content longer than 200 characters and shows See more", () => {
    const content = "a".repeat(200) + "b";
    renderFeedItem({ content });

    expect(
      screen.getByText(`${content.slice(0, 200)}...`, { exact: true }),
    ).toBeInTheDocument();
    expect(screen.queryByText(content, { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "See more" })).toBeInTheDocument();
  });

  it("reveals the full content and removes See more when clicked", async () => {
    const user = userEvent.setup();
    const content = "a".repeat(200) + " This is the rest of the post.";
    renderFeedItem({ content });

    await user.click(screen.getByRole("button", { name: "See more" }));

    expect(screen.getByText(content, { exact: true })).toBeInTheDocument();
    expect(
      screen.queryByText(`${content.slice(0, 200)}...`, { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "See more" }),
    ).not.toBeInTheDocument();
  });

  it.each([0, 3])(
    "renders a link to the post with %i comments",
    (commentCount) => {
      renderFeedItem({ commentCount });

      expect(
        screen.getByRole("link", { name: `${commentCount} Comments` }),
      ).toHaveAttribute("href", `/post/${post.cuid}`);
    },
  );

  it("renders the header with the post and the like button with its count and CUID", () => {
    renderFeedItem();

    expect(
      screen.getByRole("heading", { name: post.author.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `${post.likeCount} Likes` }),
    ).toHaveAttribute("data-post-cuid", post.cuid);
  });
});
