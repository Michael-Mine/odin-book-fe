import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import PostHeader from "./PostHeader";

const post = {
  createdAt: "2026-09-08T12:34:00.000Z",
  author: {
    cuid: "author-1",
    name: "Michael",
    picURL: "https://example.com/avatar.png",
  },
};

function renderHeader() {
  return render(
    <MemoryRouter>
      <PostHeader post={post} />
    </MemoryRouter>,
  );
}

describe("PostHeader", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the author's name as a heading", () => {
    renderHeader();

    expect(
      screen.getByRole("heading", { name: "Michael", level: 2 }),
    ).toBeInTheDocument();
  });

  it("links the author's name to their profile", () => {
    renderHeader();

    expect(screen.getByRole("link", { name: "Michael" })).toHaveAttribute(
      "href",
      "/profile/author-1",
    );
  });

  it("renders the author's profile image with alt text", () => {
    renderHeader();

    expect(screen.getByRole("img", { name: "profile pic" })).toHaveAttribute(
      "src",
      post.author.picURL,
    );
  });

  it("displays the publication date and time separated by 'at'", () => {
    // Fix localized output while keeping the real createdAt parsing.
    const dateSpy = vi.spyOn(Date.prototype, "toDateString")
      .mockReturnValue("Tue Sep 08 2026");
    const timeSpy = vi.spyOn(Date.prototype, "toLocaleTimeString")
      .mockReturnValue("12:34");

    renderHeader();

    expect(screen.getByText("Tue Sep 08 2026 at 12:34")).toBeInTheDocument();
    expect(dateSpy.mock.contexts[0].getTime()).toBe(Date.parse(post.createdAt));
    expect(timeSpy.mock.contexts[0].getTime()).toBe(Date.parse(post.createdAt));
    expect(timeSpy).toHaveBeenCalledWith([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  });
});
