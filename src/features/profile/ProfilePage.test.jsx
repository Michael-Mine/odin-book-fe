import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import useProfile from "./useProfile";
import ProfilePage from "./ProfilePage";

vi.mock("./useProfile", () => ({ default: vi.fn() }));
vi.mock("../follow/UnfollowButton", () => ({
  default: ({ userCuid }) => <button>Unfollow {userCuid}</button>,
}));
vi.mock("../follow/FollowRequestButton", () => ({
  default: ({ userCuid }) => <button>Follow {userCuid}</button>,
}));
vi.mock("./AboutEdit", () => ({
  default: ({ currentBio }) => (
    <textarea aria-label="Edit bio" defaultValue={currentBio ?? ""} />
  ),
}));
vi.mock("./ProfileTabs", () => ({
  default: function MockProfileTabs({ userCuid }) {
    const [selected, setSelected] = useState(false);
    return (
      <button aria-pressed={selected} onClick={() => setSelected(true)}>
        Tabs for {userCuid}
      </button>
    );
  },
}));

const profile = {
  cuid: "user-1",
  name: "Michael",
  picURL: "https://example.com/avatar.png",
  followerCount: 3,
  followingCount: 5,
  bio: "Hello from Michael",
  isOwnProfile: false,
  relationshipStatus: null,
};

function mockProfile(overrides = {}) {
  useProfile.mockReturnValue({
    userProfile: { ...profile, ...overrides },
    loading: false,
    error: null,
  });
}

function renderPage() {
  const router = createMemoryRouter(
    [{ path: "/users/:userCuid", element: <ProfilePage /> }],
    { initialEntries: ["/users/user-1"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile();
  });

  afterEach(cleanup);

  it("shows loading without profile content", () => {
    useProfile.mockReturnValue({ userProfile: profile, loading: true, error: null });
    renderPage();

    expect(screen.getByRole("heading", { name: "Loading..." })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows an error without profile content", () => {
    useProfile.mockReturnValue({
      userProfile: null,
      loading: false,
      error: new Error("Failed to fetch"),
    });
    renderPage();

    expect(screen.getByRole("heading", {
      name: "A network error was encountered",
    })).toBeInTheDocument();
    expect(screen.queryByText("User not found")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows user not found when there is no profile", () => {
    useProfile.mockReturnValue({ userProfile: null, loading: false, error: null });
    renderPage();

    expect(screen.getByRole("heading", { name: "User not found" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("displays profile details and passes the route user to the hook and tabs", () => {
    renderPage();

    expect(useProfile).toHaveBeenCalledWith("user-1");
    expect(screen.getByRole("heading", { name: "Michael Profile" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "profile pic" })).toHaveAttribute("src", profile.picURL);
    expect(screen.getByText("3 Followers • 5 Following")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.getByText(profile.bio)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tabs for user-1" })).toBeInTheDocument();
  });

  it("displays zero follower and following counts", () => {
    mockProfile({ followerCount: 0, followingCount: 0 });
    renderPage();
    expect(screen.getByText("0 Followers • 0 Following")).toBeInTheDocument();
  });

  it.each(["", null])("shows the fallback for bio %s", (bio) => {
    mockProfile({ bio });
    renderPage();
    expect(screen.getByText("Not updated")).toBeInTheDocument();
  });

  it("shows own-profile controls without follow controls", () => {
    mockProfile({ isOwnProfile: true });
    renderPage();

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByText("Use Gravatar to update your profile picture")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Follow / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Unfollow / })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows Follow for another user with no relationship and hides owner controls", () => {
    renderPage();

    expect(screen.getByRole("button", { name: "Follow user-1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Use Gravatar/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Unfollow / })).not.toBeInTheDocument();
    expect(screen.queryByText(/You are following|Your follow request is pending/)).not.toBeInTheDocument();
  });

  it("shows the following message and Unfollow for an accepted relationship", () => {
    mockProfile({ relationshipStatus: "ACCEPTED" });
    renderPage();

    expect(screen.getByText("You are following Michael")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unfollow user-1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Follow / })).not.toBeInTheDocument();
    expect(screen.queryByText(/Your follow request is pending/)).not.toBeInTheDocument();
  });

  it("shows the pending message without follow controls", () => {
    mockProfile({ relationshipStatus: "PENDING" });
    renderPage();

    expect(screen.getByText("Your follow request is pending with Michael")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Follow / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Unfollow / })).not.toBeInTheDocument();
    expect(screen.queryByText(/You are following/)).not.toBeInTheDocument();
  });

  it("opens the editor with the current bio and closes it on a second click", async () => {
    const user = userEvent.setup();
    mockProfile({ isOwnProfile: true });
    renderPage();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("textbox", { name: "Edit bio" })).toHaveValue(profile.bio);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("closes the editor when leaving and keeps it closed when returning", async () => {
    const user = userEvent.setup();
    useProfile.mockImplementation((cuid) => ({
      userProfile: { ...profile, cuid, isOwnProfile: cuid === "user-1" },
      loading: false,
      error: null,
    }));
    const router = renderPage();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    await act(async () => router.navigate("/users/user-2"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Follow user-2" })).toBeInTheDocument();

    await act(async () => router.navigate("/users/user-1"));
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("resets the tabs when navigating to a different profile", async () => {
    const user = userEvent.setup();
    const router = renderPage();
    await user.click(screen.getByRole("button", { name: "Tabs for user-1" }));
    expect(screen.getByRole("button", { name: "Tabs for user-1" })).toHaveAttribute("aria-pressed", "true");

    await act(async () => router.navigate("/users/user-2"));
    expect(useProfile).toHaveBeenLastCalledWith("user-2");
    expect(screen.getByRole("button", { name: "Tabs for user-2" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "Tabs for user-1" })).not.toBeInTheDocument();
  });
});
