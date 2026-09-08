import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewPost from "./NewPost";

function jsonResponse(data, ok = true) {
  return { ok, json: () => Promise.resolve(data) };
}

describe("NewPost", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("VITE_API_URL", "https://api.example.com/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("renders an empty post editor without sending a request", () => {
    render(<NewPost />);

    expect(screen.getByRole("heading", { name: "New Post" })).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add Post" })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("updates the editor as the user types", async () => {
    const user = userEvent.setup();
    render(<NewPost />);

    await user.type(screen.getByRole("textbox"), "My new post");

    expect(screen.getByRole("textbox")).toHaveValue("My new post");
  });

  it("replaces the form with Sending while the request is pending", async () => {
    fetch.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<NewPost />);

    await user.click(screen.getByRole("button", { name: "Add Post" }));

    expect(screen.getByRole("heading", { name: "Sending..." })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Post" })).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sends the post and displays confirmation on success", async () => {
    fetch.mockResolvedValue(jsonResponse({ post: { cuid: "post-123" } }));
    const user = userEvent.setup();
    render(<NewPost />);

    await user.type(screen.getByRole("textbox"), "My new post");
    await user.click(screen.getByRole("button", { name: "Add Post" }));

    expect(await screen.findByRole("heading", { name: "Post created" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledExactlyOnceWith("https://api.example.com/v1/posts", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "My new post", picURL: "" }),
    });
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("displays every validation error and preserves the entered content", async () => {
    fetch.mockResolvedValue(jsonResponse({ errors: [
      { message: "Content is invalid" },
      { message: "Picture URL is invalid" },
    ] }, false));
    const user = userEvent.setup();
    render(<NewPost />);

    await user.type(screen.getByRole("textbox"), "My draft");
    await user.click(screen.getByRole("button", { name: "Add Post" }));

    expect(await screen.findByText("Content is invalid")).toBeInTheDocument();
    expect(screen.getByText("Picture URL is invalid")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("My draft");
    expect(screen.getByRole("button", { name: "Add Post" })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    ["the server message", { message: "Server unavailable" }, "Server unavailable"],
    ["a fallback message", {}, "Failed to create post"],
  ])("shows %s for an unsuccessful HTTP response", async (_label, data, message) => {
    fetch.mockResolvedValue(jsonResponse(data, false));
    const user = userEvent.setup();
    render(<NewPost />);

    await user.click(screen.getByRole("button", { name: "Add Post" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("button", { name: "Add Post" })).toBeEnabled();
    expect(screen.queryByText("Post created")).not.toBeInTheDocument();
  });

  it("shows a network failure and restores the draft", async () => {
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    render(<NewPost />);

    await user.type(screen.getByRole("textbox"), "My draft");
    await user.click(screen.getByRole("button", { name: "Add Post" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to fetch");
    expect(screen.getByRole("textbox")).toHaveValue("My draft");
    expect(screen.getByRole("button", { name: "Add Post" })).toBeEnabled();
  });

  it("handles a response whose JSON cannot be parsed", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new SyntaxError("Invalid JSON")),
    });
    const user = userEvent.setup();
    render(<NewPost />);

    await user.click(screen.getByRole("button", { name: "Add Post" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid JSON");
    expect(screen.getByRole("button", { name: "Add Post" })).toBeEnabled();
  });

  it("clears previous errors when retrying and allows a successful submission", async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ errors: [{ message: "Content is invalid" }] }, false))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse({ post: { cuid: "post-123" } }));
    const user = userEvent.setup();
    render(<NewPost />);

    await user.type(screen.getByRole("textbox"), "My draft");
    await user.click(screen.getByRole("button", { name: "Add Post" }));
    expect(await screen.findByText("Content is invalid")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Post" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to fetch");
    expect(screen.queryByText("Content is invalid")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Post" }));
    expect(await screen.findByText("Post created")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ content: "My draft", picURL: "" });
  });
});
