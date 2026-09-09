import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FollowAcceptButton from "./FollowAcceptButton";

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("FollowAcceptButton", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_API_URL", "https://api.example.com/");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function renderButton() {
    const user = userEvent.setup();
    render(<FollowAcceptButton userCuid="requester-1" />);
    return user;
  }

  async function expectError() {
    expect(await screen.findByRole("heading", {
      name: "Unable to accept follow request",
    })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  }

  it("shows an enabled Accept button without fetching on mount", () => {
    renderButton();

    expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to the user's accept endpoint with credentials", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ follow: { id: 1 } }),
    });
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://api.example.com/v1/follow-requests/requester-1/accept",
      { method: "POST", credentials: "include" },
    );
    expect(await screen.findByRole("button", { name: "Accepted" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept", exact: true })).not.toBeInTheDocument();
  });

  it("prevents duplicate requests while fetching and parsing the response", async () => {
    const request = deferred();
    const body = deferred();
    fetchMock.mockReturnValue(request.promise);
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "Accept" }));
    const pendingButton = screen.getByRole("button", { name: "Accepting..." });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      request.resolve({ ok: true, json: () => body.promise });
    });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      body.resolve({ follow: { id: 1 } });
    });
    expect(screen.getByRole("button", { name: "Accepted" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accepting..." })).not.toBeInTheDocument();
  });

  it("does not send another request when Accepted is clicked", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ follow: { id: 1 } }),
    });
    const user = renderButton();
    await user.click(screen.getByRole("button", { name: "Accept" }));
    await user.click(await screen.findByRole("button", { name: "Accepted" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("displays a successful server message instead of a button", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "Request already handled" }),
    });
    const user = renderButton();
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByText("Request already handled")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("prioritizes follow success over a response message", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ follow: { id: 1 }, message: "Server message" }),
    });
    const user = renderButton();
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(await screen.findByRole("button", { name: "Accepted" })).toBeInTheDocument();
    expect(screen.queryByText("Server message")).not.toBeInTheDocument();
  });

  it.each([
    { status: 401, data: { message: "Unauthorized" } },
    { status: 500, data: { follow: { id: 1 } } },
  ])("rejects HTTP $status even with a response body", async ({ status, data }) => {
    fetchMock.mockResolvedValue({ ok: false, status, json: () => Promise.resolve(data) });
    const user = renderButton();
    await user.click(screen.getByRole("button", { name: "Accept" }));

    await expectError();
    expect(screen.queryByText("Unauthorized")).not.toBeInTheDocument();
  });

  it("shows an error when the network request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = renderButton();
    await user.click(screen.getByRole("button", { name: "Accept" }));

    await expectError();
  });

  it("shows an error when parsing JSON fails", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new SyntaxError("Invalid JSON")),
    });
    const user = renderButton();
    await user.click(screen.getByRole("button", { name: "Accept" }));

    await expectError();
  });
});
