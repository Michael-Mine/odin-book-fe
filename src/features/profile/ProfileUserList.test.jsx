import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ProfileUserList from "./ProfileUserList";

describe("ProfileUserList", () => {
  afterEach(cleanup);

  it.each([null, undefined])("renders nothing when users is %s", (users) => {
    const { container } = render(
      <MemoryRouter>
        <ProfileUserList
          heading="Followers"
          users={users}
          emptyMessage="No followers yet."
        />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the supplied empty message without a heading or links", () => {
    render(
      <MemoryRouter>
        <ProfileUserList
          heading="Following"
          users={[]}
          emptyMessage="Not following anyone yet."
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Not following anyone yet.")).toBeInTheDocument();
    expect(screen.queryByText("Following:")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the supplied heading and a profile link for every user", () => {
    const users = [
      { cuid: "user-1", name: "Alice" },
      { cuid: "user-2", name: "Bob" },
    ];
    render(
      <MemoryRouter>
        <ProfileUserList
          heading="Followers"
          users={users}
          emptyMessage="No followers yet."
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Followers:")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(users.length);
    for (const user of users) {
      expect(screen.getByRole("link", { name: user.name })).toHaveAttribute(
        "href",
        `/profile/${user.cuid}`,
      );
    }
    expect(screen.queryByText("No followers yet.")).not.toBeInTheDocument();
  });
});
