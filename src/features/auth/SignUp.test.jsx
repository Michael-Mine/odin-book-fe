import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUp from "./SignUp";

describe("SignUp component", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("VITE_API_URL", "https://api.example.com/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("renders heading", () => {
    render(<SignUp />);

    const title = screen.getByRole("heading", { name: "Sign Up Form" });
    expect(title).toBeInTheDocument();
  });

  it("renders heading, inputs & button", () => {
    const { container } = render(<SignUp />);

    expect(container).toMatchSnapshot();
  });

  it("all input values are updated correctly", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const name = screen.getByLabelText("Name:");
    const username = screen.getByLabelText("Email:");
    const password = screen.getByLabelText("Password:");
    const passwordCheck = screen.getByLabelText("Password Confirm:");

    await user.type(name, "Mine");
    await user.type(username, "Mr@Mine.com");
    await user.type(password, "pass");
    await user.type(passwordCheck, "pass");

    expect(name).toHaveValue("Mine");
    expect(username).toHaveValue("Mr@Mine.com");
    expect(password).toHaveValue("pass");
    expect(passwordCheck).toHaveValue("pass");
  });

  it("Signing Up text is shown while API request is in progress", async () => {
    fetch.mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    render(<SignUp />);

    const signUp = screen.getByRole("button", { name: "Sign Up" });
    await user.click(signUp);

    const signingUp = screen.getByText("Signing Up...");
    expect(signingUp).toBeInTheDocument();
  });

  it("sends the form data and displays success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ user: { cuid: "test-user", name: "Mine" } }),
    });
    const user = userEvent.setup();
    render(<SignUp />);

    await user.type(screen.getByLabelText("Name:"), "Mine");
    await user.type(screen.getByLabelText("Email:"), "mine@example.com");
    await user.type(screen.getByLabelText("Password:"), "test-password");
    await user.type(screen.getByLabelText("Password Confirm:"), "test-password");

    const signUp = screen.getByRole("button", { name: "Sign Up" });
    await user.click(signUp);

    const response = await screen.findByRole("heading", { name: "User created" });
    expect(response).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      "https://api.example.com/v1/auth/sign-up",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Mine",
          username: "mine@example.com",
          password: "test-password",
          passwordCheck: "test-password",
        }),
      },
    );
  });

  it("shows a network error and restores the submit button", async () => {
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    render(<SignUp />);

    const signUp = screen.getByRole("button", { name: "Sign Up" });
    await user.click(signUp);

    const response = await screen.findByRole("alert");
    expect(response).toHaveTextContent("Unable to sign up. Please try again.");
    expect(response).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("displays validation errors returned by the API", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        errors: [
          { field: "username", message: "Email is required" },
          { field: "password", message: "Password is too short" },
        ],
      }),
    });

    const user = userEvent.setup();
    render(<SignUp />);

    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is too short")).toBeInTheDocument();
    expect(screen.queryByText("User created")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it.each([
    { status: 401, data: { message: "Unauthorized" } },
    { status: 500, data: { user: { cuid: "unexpected-user" } } },
    { status: 400, data: { errors: [] } },
    { status: 400, data: { errors: "Invalid input" } },
    { status: 400, data: null },
  ])("shows a generic error for HTTP $status with body $data", async ({ status, data }) => {
    fetch.mockResolvedValue({ ok: false, status, json: () => Promise.resolve(data) });
    const user = userEvent.setup();
    render(<SignUp />);
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign up. Please try again.");
    expect(screen.queryByText("User created")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeEnabled();
  });

  it.each(["invalid JSON", "missing user", "null body"])("handles a successful HTTP response with %s", async (failure) => {
    fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => failure === "invalid JSON"
        ? Promise.reject(new SyntaxError("Invalid JSON"))
        : Promise.resolve(failure === "null body" ? null : {}),
    });
    const user = userEvent.setup();
    render(<SignUp />);
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign up. Please try again.");
    expect(screen.queryByText("User created")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeEnabled();
  });

  it("preserves validation errors without accepting a user from a failed response", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        user: { cuid: "unexpected-user" },
        errors: [{ field: "username", message: "Email already used" }],
      }),
    });
    const user = userEvent.setup();
    render(<SignUp />);
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Email already used")).toBeInTheDocument();
    expect(screen.queryByText("User created")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each(["network", "validation"])("clears a previous %s failure on retry, preserves inputs, and can succeed", async (failure) => {
    const validationResponse = {
      ok: false,
      status: 400,
      json: () => Promise.resolve({ errors: [{ field: "username", message: "Email already used" }] }),
    };
    if (failure === "network") {
      fetch.mockRejectedValueOnce(new TypeError("Offline"));
    } else {
      fetch.mockResolvedValueOnce(validationResponse);
    }
    const user = userEvent.setup();
    render(<SignUp />);
    await user.type(screen.getByLabelText("Name:"), "Mine");
    await user.type(screen.getByLabelText("Email:"), "mine@example.com");
    await user.type(screen.getByLabelText("Password:"), "password");
    await user.type(screen.getByLabelText("Password Confirm:"), "password");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));
    expect(await screen.findByText(failure === "network" ? "Unable to sign up. Please try again." : "Email already used")).toBeInTheDocument();

    // Keep the form visible after the retry so stale errors cannot hide behind success.
    if (failure === "network") {
      fetch.mockResolvedValueOnce(validationResponse);
    } else {
      fetch.mockRejectedValueOnce(new TypeError("Offline"));
    }
    await user.click(screen.getByRole("button", { name: "Sign Up" }));
    if (failure === "network") {
      expect(await screen.findByText("Email already used")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } else {
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.queryByText("Email already used")).not.toBeInTheDocument();
    }
    expect(screen.getByLabelText("Name:")).toHaveValue("Mine");
    expect(screen.getByLabelText("Email:")).toHaveValue("mine@example.com");
    expect(screen.getByLabelText("Password:")).toHaveValue("password");
    expect(screen.getByLabelText("Password Confirm:")).toHaveValue("password");

    fetch.mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({ user: { cuid: "user-1" } }) });
    await user.click(screen.getByRole("button", { name: "Sign Up" }));
    expect(await screen.findByRole("heading", { name: "User created" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({
      name: "Mine", username: "mine@example.com", password: "password", passwordCheck: "password",
    });
  });

  it("keeps submission controls hidden until JSON parsing finishes", async () => {
    let resolveBody;
    fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => new Promise((resolve) => { resolveBody = resolve; }),
    });
    const user = userEvent.setup();
    render(<SignUp />);
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(screen.getByRole("heading", { name: "Signing Up..." })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("User created")).not.toBeInTheDocument();
    await act(async () => resolveBody({ user: { cuid: "user-1" } }));
    expect(screen.getByRole("heading", { name: "User created" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
