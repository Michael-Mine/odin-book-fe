import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import FollowsSent from "./FollowsSent";
import useUsersFollowsSent from "./useUsersFollowsSent";

vi.mock("./useUsersFollowsSent", () => ({ default: vi.fn() }));

vi.mock("./FollowCancelButton", () => ({
  default: function FollowCancelButton({ userCuid }) {
    return <button>Cancel {userCuid}</button>;
  },
}));

const users = [
  { cuid: "user-1", name: "Michael", picURL: "https://example.com/michael.png" },
  { cuid: "user-2", name: "Sam", picURL: "https://example.com/sam.png" },
];

function renderRequests() {
  return render(
    <MemoryRouter>
      <FollowsSent />
    </MemoryRouter>,
  );
}

function expectRequestsHidden() {
  expect(screen.queryByRole("heading", { name: "Pending Follows Sent" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
}

describe("FollowsSent", () => {
  beforeEach(() => {
    useUsersFollowsSent.mockReset();
    useUsersFollowsSent.mockReturnValue({
      usersFollowsSent: users,
      error: null,
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    { usersFollowsSent: null, error: null },
    { usersFollowsSent: users, error: new Error("Previous request failed") },
  ])("shows loading before request content or errors: %o", (state) => {
    useUsersFollowsSent.mockReturnValue({ ...state, loading: true });
    renderRequests();

    expect(screen.getByRole("heading", { name: "Loading..." })).toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
    expect(screen.queryByText("Users not found")).not.toBeInTheDocument();
    expectRequestsHidden();
  });

  it.each([null, users])("shows an error instead of requests (users: %o)", (currentUsers) => {
    useUsersFollowsSent.mockReturnValue({
      usersFollowsSent: currentUsers,
      error: new Error("Request failed"),
      loading: false,
    });
    renderRequests();

    expect(screen.getByRole("heading", { name: "A network error was encountered" })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText("Users not found")).not.toBeInTheDocument();
    expectRequestsHidden();
  });

  it("shows users not found when loading finishes without data", () => {
    useUsersFollowsSent.mockReturnValue({
      usersFollowsSent: null, error: null, loading: false,
    });
    renderRequests();

    expect(screen.getByRole("heading", { name: "Users not found" })).toBeInTheDocument();
    expectRequestsHidden();
  });

  it("shows an empty state when there are no sent requests", () => {
    useUsersFollowsSent.mockReturnValue({
      usersFollowsSent: [], error: null, loading: false,
    });
    renderRequests();

    expect(screen.getByRole("heading", { name: "No Pending Follows Sent" })).toBeInTheDocument();
    expect(screen.queryByText("Users not found")).not.toBeInTheDocument();
    expectRequestsHidden();
  });

  it("renders the heading and a profile link for every user", () => {
    renderRequests();

    expect(screen.getByRole("heading", { name: "Pending Follows Sent" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(users.length);
    for (const user of users) {
      expect(screen.getByRole("link", { name: user.name })).toHaveAttribute("href", `/profile/${user.cuid}`);
    }
  });

  it("renders each user's avatar and passes their cuid to the cancel button", () => {
    renderRequests();

    expect(screen.getAllByRole("button")).toHaveLength(users.length);
    for (const user of users) {
      const row = within(screen.getByRole("link", { name: user.name }).parentElement);
      expect(row.getByRole("img", { name: "profile pic" })).toHaveAttribute("src", user.picURL);
      expect(row.getByRole("button", { name: `Cancel ${user.cuid}` })).toBeInTheDocument();
    }
  });
});
