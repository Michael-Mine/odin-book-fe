import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import NewFollowsPage from "./NewFollowsPage";

vi.mock("./FollowsReceived", () => ({
  default: function FollowsReceived() {
    return <div>Received follow requests</div>;
  },
}));

vi.mock("./FollowsSent", () => ({
  default: function FollowsSent() {
    return <div>Sent follow requests</div>;
  },
}));

vi.mock("./UserList", () => ({
  default: function UserList() {
    return <div>Users to follow</div>;
  },
}));

describe("NewFollowsPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders received requests, sent requests, and users to follow", () => {
    render(<NewFollowsPage />);

    expect(screen.getByText("Received follow requests")).toBeInTheDocument();
    expect(screen.getByText("Sent follow requests")).toBeInTheDocument();
    expect(screen.getByText("Users to follow")).toBeInTheDocument();
  });
});
