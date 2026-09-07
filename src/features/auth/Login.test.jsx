import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router";
import Login from "./Login";

function renderLogin() {
  const setUser = vi.fn();

  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route element={<Outlet context={{ setUser }} />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<h1>Feed</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  return { setUser };
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

    expect(setUser).toHaveBeenCalledWith(loggedInUser);

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
      await screen.findByText("A network error was encountered"),
    ).toBeInTheDocument();

    expect(setUser).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });
});
