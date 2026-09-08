import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import UsersLiked from "./UsersLiked";

const likes = [
  { user: { cuid: "user-1", name: "Michael" } },
  { user: { cuid: "user-2", name: "Alex" } },
];

function renderUsersLiked(items = likes) {
  return render(
    <MemoryRouter>
      <UsersLiked likes={items} />
    </MemoryRouter>,
  );
}

describe("UsersLiked", () => {
  afterEach(() => {
    cleanup();
  });

  it("displays the label and every user's name", () => {
    renderUsersLiked();

    expect(screen.getByText("Users Liked:")).toBeInTheDocument();
    expect(screen.getByText("Michael")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("links each user's name to their own profile", () => {
    renderUsersLiked();

    expect(screen.getByRole("link", { name: "Michael" })).toHaveAttribute(
      "href",
      "/profile/user-1",
    );
    expect(screen.getByRole("link", { name: "Alex" })).toHaveAttribute(
      "href",
      "/profile/user-2",
    );
  });

  it("displays the label without profile links when the array is empty", () => {
    renderUsersLiked([]);

    expect(screen.getByText("Users Liked:")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryByText("Michael")).not.toBeInTheDocument();
    expect(screen.queryByText("Alex")).not.toBeInTheDocument();
  });
});
