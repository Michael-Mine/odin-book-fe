import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import FollowsReceived from "./FollowsReceived";
import useUsersFollowsReceived from "./useUsersFollowsReceived";

vi.mock("./useUsersFollowsReceived", () => ({ default: vi.fn() }));

vi.mock("./FollowAcceptButton", () => ({
  default: function FollowAcceptButton({ userCuid }) {
    return <button>Accept {userCuid}</button>;
  },
}));

vi.mock("./FollowRejectButton", () => ({
  default: function FollowRejectButton({ userCuid }) {
    return <button>Reject {userCuid}</button>;
  },
}));

const users = [
  { cuid: "user-1", name: "Michael", picURL: "https://example.com/michael.png" },
  { cuid: "user-2", name: "Sam", picURL: "https://example.com/sam.png" },
];

function renderRequests() {
  return render(
    <MemoryRouter>
      <FollowsReceived />
    </MemoryRouter>,
  );
}

function expectRequestsHidden() {
  expect(screen.queryByRole("heading", { name: "New Follow Requests" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
}

describe("FollowsReceived", () => {
  beforeEach(() => {
    useUsersFollowsReceived.mockReset();
    useUsersFollowsReceived.mockReturnValue({
      usersFollowsReceived: users,
      error: null,
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    { usersFollowsReceived: null, error: null },
    { usersFollowsReceived: users, error: new Error("Previous request failed") },
  ])("shows loading before request content or errors: %o", (state) => {
    useUsersFollowsReceived.mockReturnValue({ ...state, loading: true });
    renderRequests();

    expect(screen.getByRole("heading", { name: "Loading..." })).toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
    expect(screen.queryByText("Users not found")).not.toBeInTheDocument();
    expectRequestsHidden();
  });

  it.each([null, users])("shows an error instead of requests (users: %o)", (currentUsers) => {
    useUsersFollowsReceived.mockReturnValue({
      usersFollowsReceived: currentUsers,
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
    useUsersFollowsReceived.mockReturnValue({
      usersFollowsReceived: null, error: null, loading: false,
    });
    renderRequests();

    expect(screen.getByRole("heading", { name: "Users not found" })).toBeInTheDocument();
    expectRequestsHidden();
  });

  it("shows an empty state when there are no received requests", () => {
    useUsersFollowsReceived.mockReturnValue({
      usersFollowsReceived: [], error: null, loading: false,
    });
    renderRequests();

    expect(screen.getByRole("heading", { name: "No Pending Follows Received" })).toBeInTheDocument();
    expect(screen.queryByText("Users not found")).not.toBeInTheDocument();
    expectRequestsHidden();
  });

  it("renders the heading and a profile link for every user", () => {
    renderRequests();

    expect(screen.getByRole("heading", { name: "New Follow Requests" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(users.length);
    for (const user of users) {
      expect(screen.getByRole("link", { name: user.name })).toHaveAttribute("href", `/profile/${user.cuid}`);
    }
  });

  it("renders each user's avatar and passes their cuid to both action buttons", () => {
    renderRequests();

    expect(screen.getAllByRole("button")).toHaveLength(users.length * 2);
    for (const user of users) {
      const row = within(screen.getByRole("link", { name: user.name }).parentElement);
      expect(row.getByRole("img", { name: "profile pic" })).toHaveAttribute("src", user.picURL);
      expect(row.getByRole("button", { name: `Accept ${user.cuid}` })).toBeInTheDocument();
      expect(row.getByRole("button", { name: `Reject ${user.cuid}` })).toBeInTheDocument();
    }
  });
});
