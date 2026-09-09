import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import UserList from "./UserList";
import useUsersToFollow from "./useUsersToFollow";

vi.mock("./useUsersToFollow", () => ({ default: vi.fn() }));

vi.mock("./FollowRequestButton", () => ({
  default: function FollowRequestButton({ userCuid }) {
    return <button>Follow {userCuid}</button>;
  },
}));

const users = [
  { cuid: "user-1", name: "Michael", picURL: "https://example.com/michael.png" },
  { cuid: "user-2", name: "Sam", picURL: "https://example.com/sam.png" },
];

function renderUsers() {
  return render(
    <MemoryRouter>
      <UserList />
    </MemoryRouter>,
  );
}

function expectUsersHidden() {
  expect(screen.queryByRole("heading", { name: "Find People to Connect" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
}

describe("UserList", () => {
  beforeEach(() => {
    useUsersToFollow.mockReset();
    useUsersToFollow.mockReturnValue({
      usersToFollow: users,
      error: null,
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    { usersToFollow: null, error: null },
    { usersToFollow: users, error: new Error("Previous request failed") },
  ])("shows loading before user content or errors: %o", (state) => {
    useUsersToFollow.mockReturnValue({ ...state, loading: true });
    renderUsers();

    expect(screen.getByRole("heading", { name: "Loading..." })).toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
    expect(screen.queryByText("Users not found")).not.toBeInTheDocument();
    expectUsersHidden();
  });

  it.each([null, users])("shows an error instead of users (users: %o)", (currentUsers) => {
    useUsersToFollow.mockReturnValue({
      usersToFollow: currentUsers,
      error: new Error("Request failed"),
      loading: false,
    });
    renderUsers();

    expect(screen.getByRole("heading", { name: "A network error was encountered" })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText("Users not found")).not.toBeInTheDocument();
    expectUsersHidden();
  });

  it("shows users not found when loading finishes without data", () => {
    useUsersToFollow.mockReturnValue({
      usersToFollow: null, error: null, loading: false,
    });
    renderUsers();

    expect(screen.getByRole("heading", { name: "Users not found" })).toBeInTheDocument();
    expectUsersHidden();
  });

  it("keeps the heading but renders no user content for an empty list", () => {
    useUsersToFollow.mockReturnValue({
      usersToFollow: [], error: null, loading: false,
    });
    renderUsers();

    expect(screen.getByRole("heading", { name: "Find People to Connect" })).toBeInTheDocument();
    expect(screen.queryByText("Users not found")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the heading and a profile link for every user", () => {
    renderUsers();

    expect(screen.getByRole("heading", { name: "Find People to Connect" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(users.length);
    for (const user of users) {
      expect(screen.getByRole("link", { name: user.name })).toHaveAttribute("href", `/profile/${user.cuid}`);
    }
  });

  it("renders each user's avatar and passes their cuid to the follow button", () => {
    renderUsers();

    expect(screen.getAllByRole("button")).toHaveLength(users.length);
    for (const user of users) {
      const row = within(screen.getByRole("link", { name: user.name }).parentElement);
      expect(row.getByRole("img", { name: "profile pic" })).toHaveAttribute("src", user.picURL);
      expect(row.getByRole("button", { name: `Follow ${user.cuid}` })).toBeInTheDocument();
    }
  });
});
