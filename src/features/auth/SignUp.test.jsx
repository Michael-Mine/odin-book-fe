import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

    const response = await screen.findByText("A network error was encountered");
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
});
