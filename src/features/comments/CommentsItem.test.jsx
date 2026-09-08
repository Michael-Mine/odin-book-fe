import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import CommentsItem from "./CommentsItem";

const comment = {
  cuid: "comment-1",
  content: "This is a comment for the test",
  createdAt: "2026-09-08T12:34:00.000Z",
  author: {
    cuid: "author-1",
    name: "Michael",
    picURL: "https://example.com/avatar.png",
  },
};

function renderComment() {
  return render(
    <MemoryRouter>
      <CommentsItem comment={comment} />
    </MemoryRouter>,
  );
}

describe("CommentsItem", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the comment content", () => {
    renderComment();

    expect(screen.getByText(comment.content)).toBeInTheDocument();
  });

  it("links the author's name to their profile", () => {
    renderComment();

    expect(screen.getByRole("link", { name: "Michael" })).toHaveAttribute(
      "href",
      "/profile/author-1",
    );
  });

  it("renders the author's profile image with alt text", () => {
    renderComment();

    expect(screen.getByRole("img", { name: "profile pic" })).toHaveAttribute(
      "src",
      comment.author.picURL,
    );
  });

  it("displays the publication date as 'on date at time'", () => {
    // Fix localized output while keeping the real createdAt parsing.
    const dateSpy = vi.spyOn(Date.prototype, "toDateString")
      .mockReturnValue("Tue Sep 08 2026");
    const timeSpy = vi.spyOn(Date.prototype, "toLocaleTimeString")
      .mockReturnValue("12:34");

    renderComment();

    expect(screen.getByText("on Tue Sep 08 2026 at 12:34")).toBeInTheDocument();
    expect(dateSpy.mock.contexts[0].getTime()).toBe(Date.parse(comment.createdAt));
    expect(timeSpy.mock.contexts[0].getTime()).toBe(Date.parse(comment.createdAt));
    expect(timeSpy).toHaveBeenCalledWith([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  });
});
