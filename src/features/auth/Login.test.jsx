import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login";

describe("Login component", () => {
  it("renders heading, buttons, inputs", () => {
    const { container } = render(<Login setLoggedIn={() => {}} />);

    expect(container).toMatchSnapshot();
  });

  it("email input value is updated correctly", async () => {
    const user = userEvent.setup();
    render(<Login setLoggedIn={() => {}} />);

    const input = screen.getByTestId("username-input");

    await user.type(input, "Cool email");

    expect(input.value).toBe("Cool email");
  });

  it("password input value is updated correctly", async () => {
    const user = userEvent.setup();
    render(<Login setLoggedIn={() => {}} />);

    const input = screen.getByTestId("password-input");

    await user.type(input, "Cool password");

    expect(input.value).toBe("Cool password");
  });

  it("logging in text is shown while API request is in progress", async () => {
    const user = userEvent.setup();
    render(<Login setLoggedIn={() => {}} />);

    const login = screen.getByRole("button", { name: "Login" });
    await user.click(login);

    const loggingIn = screen.getByText("Logging In...");
    expect(loggingIn).toBeInTheDocument();
  });

  it("callback is called after successful API request", async () => {
    window.fetch = vi.fn(() => {
      const response = { message: "Auth Passed", token: "test" };

      return Promise.resolve({
        json: () => Promise.resolve(response),
      });
    });
    const setLoggedIn = vi.fn();
    const user = userEvent.setup();
    render(<Login setLoggedIn={setLoggedIn} />);

    const login = screen.getByRole("button", { name: "Login" });
    await user.click(login);

    expect(setLoggedIn).toHaveBeenCalled();
  });

  it("response is rendered after successful API request but not auth", async () => {
    window.fetch = vi.fn(() => {
      const response = { message: "Auth Failed" };

      return Promise.resolve({
        json: () => Promise.resolve(response),
      });
    });
    const user = userEvent.setup();
    render(<Login setLoggedIn={() => {}} />);

    const login = screen.getByRole("button", { name: "Login" });
    await user.click(login);

    const response = screen.getByText("Auth Failed");
    expect(response).toBeInTheDocument();
  });

  it("error text is rendered after API request", async () => {
    window.fetch = vi.fn(() => {
      const response = { message: "Auth failed" };

      return Promise.reject({
        json: () => Promise.resolve(response),
      });
    });

    const user = userEvent.setup();
    render(<Login setLoggedIn={() => {}} />);

    const login = screen.getByRole("button", { name: "Login" });
    await user.click(login);

    const response = screen.getByText("A network error was encountered");
    expect(response).toBeInTheDocument();
  });
});
