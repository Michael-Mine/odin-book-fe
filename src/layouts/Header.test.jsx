import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "./Header";

describe("Header", () => {
  const user = { picURL: "https://example.com/profile.png" };
  let fetchMock;
  let setUser;

  beforeEach(() => {
    fetchMock = vi.fn();
    setUser = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_API_URL", "https://api.example.com/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("renders the heading, user profile image, and logout button", () => {
    render(<Header user={user} setUser={setUser} />);

    expect(
      screen.getByRole("heading", { name: "Mr Mine Odin-Book", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "profile pic" })).toHaveAttribute(
      "src",
      user.picURL,
    );
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(setUser).not.toHaveBeenCalled();
  });

  it("posts to the logout endpoint with credentials when clicked", async () => {
    const userActions = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: true, status: 204 });
    render(<Header user={user} setUser={setUser} />);

    await userActions.click(screen.getByRole("button", { name: "Logout" }));

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://api.example.com/v1/auth/logout",
      { method: "POST", credentials: "include" },
    );
  });

  it("clears the user after a successful logout", async () => {
    const userActions = userEvent.setup();
    fetchMock.mockResolvedValue({ ok: true, status: 204 });
    render(<Header user={user} setUser={setUser} />);

    await userActions.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(setUser).toHaveBeenCalledExactlyOnceWith(null);
    });
  });

  it("keeps the user until the logout request succeeds", async () => {
    const userActions = userEvent.setup();
    let resolveRequest;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    render(<Header user={user} setUser={setUser} />);

    await userActions.click(screen.getByRole("button", { name: "Logout" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(setUser).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Logging out..." })).toBeDisabled();

    await userActions.click(screen.getByRole("button", { name: "Logging out..." }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest({ ok: true, status: 204 });
    });

    expect(setUser).toHaveBeenCalledExactlyOnceWith(null);
  });

  it.each(["HTTP error", "network rejection"])(
    "does not clear the user and allows retry after a %s",
    async (failure) => {
      const userActions = userEvent.setup();
      if (failure === "HTTP error") {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
      } else {
        fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      }
      render(<Header user={user} setUser={setUser} />);

      await userActions.click(screen.getByRole("button", { name: "Logout" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Unable to log out. Please try again.",
      );
      expect(setUser).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Logout" })).toBeEnabled();
    },
  );

  it("clears the previous error when retrying and logs out after success", async () => {
    const userActions = userEvent.setup();
    let resolveRetry;
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fetchMock.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveRetry = resolve;
      }),
    );
    render(<Header user={user} setUser={setUser} />);

    await userActions.click(screen.getByRole("button", { name: "Logout" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await userActions.click(screen.getByRole("button", { name: "Logout" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logging out..." })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(setUser).not.toHaveBeenCalled();

    await act(async () => {
      resolveRetry({ ok: true, status: 204 });
    });

    expect(setUser).toHaveBeenCalledExactlyOnceWith(null);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeEnabled();
  });
});
