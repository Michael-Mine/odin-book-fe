import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import Login from "./Login";

function renderLogin(entry = "/login") {
  const setUser = vi.fn();
  const router = createMemoryRouter([
    {
      element: <Outlet context={{ setUser }} />,
      children: [
        { path: "/login", element: <Login /> },
        { path: "/", element: <h1>Feed</h1> },
        { path: "/new-post", element: <h1>New post</h1> },
      ],
    },
  ], { initialEntries: [entry] });
  render(<RouterProvider router={router} />);
  return { setUser, router };
}

describe("Login component", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("VITE_API_URL", "https://api.example.com/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("renders headings, buttons, and inputs", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: "Login to access" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Email:")).toBeInTheDocument();
    expect(screen.getByLabelText("Password:")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "or Sign Up" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Guest Login" }),
    ).toBeInTheDocument();
  });

  it("updates the email input", async () => {
    const user = userEvent.setup();
    renderLogin();

    const input = screen.getByLabelText("Email:");

    await user.type(input, "test@example.com");

    expect(input).toHaveValue("test@example.com");
  });

  it("updates the password input", async () => {
    const user = userEvent.setup();
    renderLogin();

    const input = screen.getByLabelText("Password:");

    await user.type(input, "test-password");

    expect(input).toHaveValue("test-password");
  });

  it("shows loading text while the request is pending", async () => {
    // Keep the request pending so the loading state can be observed.
    fetch.mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Email:"), "test@example.com");
    await user.type(screen.getByLabelText("Password:"), "test-password");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByText("Logging In...")).toBeInTheDocument();
  });

  it("sends credentials, sets the user, and navigates on success", async () => {
    const loggedInUser = {
      cuid: "test-user",
      name: "Michael",
    };

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: loggedInUser }),
    });

    const user = userEvent.setup();
    const { setUser } = renderLogin();

    await user.type(screen.getByLabelText("Email:"), "test@example.com");
    await user.type(screen.getByLabelText("Password:"), "test-password");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByRole("heading", { name: "Feed" }),
    ).toBeInTheDocument();

    expect(setUser).toHaveBeenCalledExactlyOnceWith(loggedInUser);

    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      "https://api.example.com/v1/auth/login",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: "test@example.com",
          password: "test-password",
        }),
      },
    );
  });

  it("shows an authentication failure for rejected credentials", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Auth Failed" }),
    });

    const user = userEvent.setup();
    const { setUser } = renderLogin();

    await user.type(screen.getByLabelText("Email:"), "test@example.com");
    await user.type(screen.getByLabelText("Password:"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Authentication failed"),
    ).toBeInTheDocument();

    expect(setUser).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("shows an error when the request rejects", async () => {
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const user = userEvent.setup();
    const { setUser } = renderLogin();

    await user.type(screen.getByLabelText("Email:"), "test@example.com");
    await user.type(screen.getByLabelText("Password:"), "test-password");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Unable to log in. Please try again."),
    ).toBeInTheDocument();

    expect(setUser).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });
  it("uses the configured guest credentials", async () => {
    vi.stubEnv("VITE_GUEST_EMAIL", "guest@example.com");
    vi.stubEnv("VITE_GUEST_PASS", "guest-password");
    const guest = { cuid: "guest", name: "Guest" };
    fetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ user: guest }) });
    const user = userEvent.setup();
    const { setUser } = renderLogin();
    await user.click(screen.getByRole("button", { name: "Guest Login" }));
    expect(await screen.findByRole("heading", { name: "Feed" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledExactlyOnceWith("https://api.example.com/v1/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "guest@example.com", password: "guest-password" }),
    });
    expect(setUser).toHaveBeenCalledExactlyOnceWith(guest);
  });

  it("toggles the signup form without sending a request", async () => {
    const user = userEvent.setup();
    renderLogin();
    expect(screen.queryByRole("heading", { name: "Sign Up Form" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "or Sign Up" }));
    expect(screen.getByRole("heading", { name: "Sign Up Form" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "or Sign Up" }));
    expect(screen.queryByRole("heading", { name: "Sign Up Form" })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns to the requested URL including query and hash using replace", async () => {
    fetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ user: { cuid: "user-1" } }) });
    const user = userEvent.setup();
    const { router } = renderLogin({
      pathname: "/login",
      state: { from: { pathname: "/new-post", search: "?draft=123", hash: "#editor" } },
    });
    await user.click(screen.getByRole("button", { name: "Login", exact: true }));
    expect(await screen.findByRole("heading", { name: "New post" })).toBeInTheDocument();
    expect(router.state.location).toMatchObject({ pathname: "/new-post", search: "?draft=123", hash: "#editor" });
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it.each([401, 403, 500])("does not authenticate a user from an HTTP %i response", async (status) => {
    fetch.mockResolvedValue({ ok: false, status, json: () => Promise.resolve({ user: { cuid: "user-1" } }) });
    const user = userEvent.setup();
    const { setUser, router } = renderLogin();
    await user.click(screen.getByRole("button", { name: "Login", exact: true }));
    expect(await screen.findByText(status === 401 ? "Authentication failed" : "Unable to log in. Please try again.")).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByRole("button", { name: "Login", exact: true })).toBeEnabled();
  });

  it.each(["invalid JSON", "missing user", "null body"])("handles %s without authenticating", async (failure) => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => failure === "invalid JSON"
        ? Promise.reject(new SyntaxError("Invalid JSON"))
        : Promise.resolve(failure === "null body" ? null : {}),
    });
    const user = userEvent.setup();
    const { setUser, router } = renderLogin();
    await user.click(screen.getByRole("button", { name: "Login", exact: true }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to log in. Please try again.");
    expect(setUser).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByRole("button", { name: "Login", exact: true })).toBeEnabled();
  });

  it.each(["authentication", "network"])("clears a previous %s failure on retry and can succeed", async (failure) => {
    if (failure === "authentication") {
      fetch.mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({}) });
    } else {
      fetch.mockRejectedValueOnce(new TypeError("Offline"));
    }
    const user = userEvent.setup();
    const { setUser } = renderLogin();
    await user.type(screen.getByLabelText("Email:"), "user@example.com");
    await user.type(screen.getByLabelText("Password:"), "password");
    await user.click(screen.getByRole("button", { name: "Login", exact: true }));
    expect(await screen.findByText(failure === "authentication" ? "Authentication failed" : "Unable to log in. Please try again.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email:")).toHaveValue("user@example.com");
    expect(screen.getByLabelText("Password:")).toHaveValue("password");

    // An opposite failure keeps the form visible so stale errors cannot hide behind navigation.
    fetch.mockResolvedValueOnce({
      ok: false,
      status: failure === "authentication" ? 500 : 401,
      json: () => Promise.resolve({}),
    });
    await user.click(screen.getByRole("button", { name: "Login", exact: true }));
    if (failure === "authentication") {
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.queryByText("Authentication failed")).not.toBeInTheDocument();
    } else {
      expect(await screen.findByText("Authentication failed")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    }
    const loggedInUser = { cuid: "user-1" };
    fetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ user: loggedInUser }) });
    await user.click(screen.getByRole("button", { name: "Login", exact: true }));
    expect(await screen.findByRole("heading", { name: "Feed" })).toBeInTheDocument();
    expect(setUser).toHaveBeenCalledExactlyOnceWith(loggedInUser);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("keeps login controls hidden while JSON parsing is pending", async () => {
    let resolveBody;
    fetch.mockResolvedValue({ ok: true, status: 200, json: () => new Promise((resolve) => { resolveBody = resolve; }) });
    const user = userEvent.setup();
    const { setUser } = renderLogin();
    await user.click(screen.getByRole("button", { name: "Login", exact: true }));
    expect(screen.getByText("Logging In...")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
    await act(async () => resolveBody({ user: { cuid: "user-1" } }));
    expect(screen.getByRole("heading", { name: "Feed" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

});
