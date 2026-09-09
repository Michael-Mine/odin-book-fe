import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AboutEdit from "./AboutEdit";

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

describe("AboutEdit", () => {
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

  it("renders the current bio and update controls without submitting", () => {
    render(<AboutEdit currentBio="My current bio" />);

    expect(screen.getByRole("heading", { name: "Edit About - max 160 characters" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("My current bio");
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "160");
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([null, undefined, ""])("starts with an editable empty field for bio %s", async (currentBio) => {
    const user = userEvent.setup();
    render(<AboutEdit currentBio={currentBio} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
    await user.type(input, "New bio");
    expect(input).toHaveValue("New bio");
  });

  it("submits the edited bio and shows pending then success states", async () => {
    const user = userEvent.setup();
    const request = deferred();
    fetchMock.mockReturnValue(request.promise);
    render(<AboutEdit currentBio="Old bio" />);

    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Updated bio");
    expect(screen.getByRole("textbox")).toHaveValue("Updated bio");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/v1/users/me", {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bio: "Updated bio" }),
    });
    expect(screen.getByRole("heading", { name: "Sending..." })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();

    await act(async () => request.resolve(jsonResponse({ user: { bio: "Updated bio" } })));
    expect(screen.getByRole("heading", { name: "About Updated" })).toBeInTheDocument();
    expect(screen.queryByText("Sending...")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("allows clearing the bio and submits an empty string", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(jsonResponse({ user: { bio: "" } }));
    render(<AboutEdit currentBio="Old bio" />);

    await user.clear(screen.getByRole("textbox"));
    await user.click(screen.getByRole("button", { name: "Update" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ bio: "" });
    expect(await screen.findByText("About Updated")).toBeInTheDocument();
  });

  it("shows all validation messages from a 400 response and preserves the edited bio", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(jsonResponse({ errors: [
      { message: "Bio is too long" },
      { message: "Bio contains invalid characters" },
    ] }, 400));
    render(<AboutEdit currentBio="" />);

    await user.type(screen.getByRole("textbox"), "My edited bio");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(await screen.findByText("Bio is too long")).toBeInTheDocument();
    expect(screen.getByText("Bio contains invalid characters")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("My edited bio");
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.queryByText("A network error was encountered")).not.toBeInTheDocument();
    expect(screen.queryByText("About Updated")).not.toBeInTheDocument();
  });

  it.each([
    [500, { message: "Server error" }],
    [401, { message: "Unauthorized" }],
    [400, { errors: [] }],
    [400, { errors: "Invalid bio" }],
    [500, { errors: [{ message: "Server failure" }] }],
  ])("shows an error for HTTP %i without supported validation errors (%j)", async (status, data) => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(jsonResponse(data, status));
    render(<AboutEdit currentBio="Saved bio" />);

    await user.click(screen.getByRole("button", { name: "Update" }));
    expect(await screen.findByText("A network error was encountered")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("Saved bio");
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.queryByText("About Updated")).not.toBeInTheDocument();
  });

  it.each(["network", "JSON parsing"])("restores the edited form after a %s failure", async (failure) => {
    const user = userEvent.setup();
    if (failure === "network") {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    } else {
      fetchMock.mockResolvedValue({ ok: true, json: () => Promise.reject(new SyntaxError("Invalid JSON")) });
    }
    render(<AboutEdit currentBio="Old bio" />);

    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Edited bio");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(await screen.findByText("A network error was encountered")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("Edited bio");
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.queryByText("Sending...")).not.toBeInTheDocument();
  });

  it.each(["network", "validation"])("clears the previous %s error on retry", async (failure) => {
    const user = userEvent.setup();
    const retry = deferred();
    if (failure === "network") {
      fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    } else {
      fetchMock.mockResolvedValueOnce(jsonResponse({ errors: [{ message: "Invalid bio" }] }, 400));
    }
    fetchMock.mockReturnValueOnce(retry.promise);
    render(<AboutEdit currentBio="Original bio" />);
    await user.click(screen.getByRole("button", { name: "Update" }));
    const message = failure === "network" ? "A network error was encountered" : "Invalid bio";
    expect(await screen.findByText(message)).toBeInTheDocument();

    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Corrected bio");
    await user.click(screen.getByRole("button", { name: "Update" }));
    expect(screen.getByText("Sending...")).toBeInTheDocument();
    expect(screen.queryByText(message)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ bio: "Corrected bio" });

    // Keep the form visible after retry so stale errors cannot hide behind success UI.
    await act(async () => retry.resolve(jsonResponse({})));
    expect(screen.getByRole("textbox")).toHaveValue("Corrected bio");
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });
});
