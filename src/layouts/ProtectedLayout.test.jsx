import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
  Outlet,
  useOutletContext,
} from "react-router";
import ProtectedLayout from "./ProtectedLayout";

const user = {
  name: "Michael",
  cuid: "test-user",
  picURL: "https://example.com/avatar.png",
};

function ProtectedPage() {
  const currentUser = useOutletContext();

  return <h2>Protected page for {currentUser.name}</h2>;
}

function renderLayout(auth = {}) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <Outlet
            context={{
              user: null,
              setUser: vi.fn(),
              loading: false,
              error: null,
              ...auth,
            }}
          />
        ),
        children: [
          { path: "/login", element: <h1>Login page</h1> },
          {
            element: <ProtectedLayout />,
            children: [
              { path: "/new-post", element: <ProtectedPage /> },
            ],
          },
        ],
      },
    ],
    { initialEntries: ["/new-post?draft=123#editor"] },
  );

  render(<RouterProvider router={router} />);

  return router;
}

function expectProtectedContentHidden() {
  expect(
    screen.queryByRole("heading", { name: /Protected page for/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Logout" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
}

describe("ProtectedLayout", () => {
  it.each([
    { user: null, error: null },
    { user, error: null },
    { user: null, error: new Error("Session failed") },
  ])("shows loading before checking user or error: %o", (auth) => {
    const router = renderLayout({ ...auth, loading: true });

    expect(
      screen.getByRole("heading", { name: "Loading..." }),
    ).toBeInTheDocument();
    expectProtectedContentHidden();
    expect(
      screen.queryByRole("heading", { name: "Login page" }),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/new-post");
  });

  it.each([null, user])(
    "shows a session error without rendering protected content or redirecting (user: %o)",
    (currentUser) => {
      const router = renderLayout({
        user: currentUser,
        error: new Error("Session failed"),
      });

      expect(
        screen.getByRole("heading", {
          name: /Unable to check your session/,
        }),
      ).toBeInTheDocument();
      expectProtectedContentHidden();
      expect(
        screen.queryByRole("heading", { name: "Loading..." }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Login page" }),
      ).not.toBeInTheDocument();
      expect(router.state.location.pathname).toBe("/new-post");
    },
  );

  it("redirects a logged-out user to login, replacing the entry and preserving the requested location", async () => {
    const router = renderLayout();

    expect(
      await screen.findByRole("heading", { name: "Login page" }),
    ).toBeInTheDocument();
    expectProtectedContentHidden();
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(router.state.location.state.from).toMatchObject({
      pathname: "/new-post",
      search: "?draft=123",
      hash: "#editor",
    });
  });

  it("renders the header, sidebar, and child route with the authenticated user as outlet context", () => {
    const router = renderLayout({ user });

    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "profile pic" })).toHaveAttribute(
      "src",
      user.picURL,
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute(
      "href",
      `/profile/${user.cuid}`,
    );
    expect(
      screen.getByRole("heading", { name: "Protected page for Michael" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Loading..." }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Unable to check your session/ }),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/new-post");
  });
});
