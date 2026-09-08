import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import WriteComment from "./WriteComment";

function jsonResponse(data, status = 201) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(data) };
}

function renderForm() {
  render(
    <MemoryRouter initialEntries={["/post/post-123"]}>
      <Routes>
        <Route path="/post/:postCuid" element={<WriteComment />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const errorMessage = "A network error was encountered";

describe("WriteComment", () => {
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

  it("renders an empty editor with a 1000-character limit without fetching", () => {
    renderForm();

    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "1000");
    expect(screen.getByRole("button", { name: "Add Comment" })).toBeEnabled();
    expect(screen.queryByText("Sending...")).not.toBeInTheDocument();
    expect(screen.queryByText("Comment created")).not.toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updates the editor as the user types", async () => {
    const user = renderForm();

    await user.type(screen.getByRole("textbox"), "My comment");

    expect(screen.getByRole("textbox")).toHaveValue("My comment");
  });

  it("replaces the editor and button with Sending while the request is pending", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const user = renderForm();

    await user.click(screen.getByRole("button", { name: "Add Comment" }));

    expect(screen.getByRole("heading", { name: "Sending..." })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Comment" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("posts the entered comment to the route's post and displays success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ comment: { cuid: "comment-1" } }));
    const user = renderForm();

    await user.type(screen.getByRole("textbox"), "My comment");
    await user.click(screen.getByRole("button", { name: "Add Comment" }));

    expect(await screen.findByRole("heading", { name: "Comment created" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://api.example.com/v1/posts/post-123/comments",
      {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "My comment" }),
      },
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Comment" })).not.toBeInTheDocument();
    expect(screen.queryByText("Sending...")).not.toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  it("displays every validation message from a non-OK response and preserves the draft", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ errors: [
      { message: "Content is invalid" },
      { message: "Content must contain text" },
    ] }, 400));
    const user = renderForm();

    await user.type(screen.getByRole("textbox"), "My draft");
    await user.click(screen.getByRole("button", { name: "Add Comment" }));

    expect(await screen.findByText("Content is invalid")).toBeInTheDocument();
    expect(screen.getByText("Content must contain text")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("My draft");
    expect(screen.getByRole("button", { name: "Add Comment" })).toBeEnabled();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.queryByText("Comment created")).not.toBeInTheDocument();
  });

  it.each([{}, { errors: [] }])("shows an error for HTTP 500 with body %j", async (data) => {
    fetchMock.mockResolvedValue(jsonResponse(data, 500));
    const user = renderForm();

    await user.type(screen.getByRole("textbox"), "My draft");
    await user.click(screen.getByRole("button", { name: "Add Comment" }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("My draft");
    expect(screen.getByRole("button", { name: "Add Comment" })).toBeEnabled();
    expect(screen.queryByText("Comment created")).not.toBeInTheDocument();
  });

  it.each(["network", "JSON parsing"])("restores the draft after a %s failure", async (failure) => {
    if (failure === "network") {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    } else {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.reject(new SyntaxError("Invalid JSON")),
      });
    }
    const user = renderForm();

    await user.type(screen.getByRole("textbox"), "My draft");
    await user.click(screen.getByRole("button", { name: "Add Comment" }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("My draft");
    expect(screen.getByRole("button", { name: "Add Comment" })).toBeEnabled();
    expect(screen.queryByText("Sending...")).not.toBeInTheDocument();
    expect(screen.queryByText("Comment created")).not.toBeInTheDocument();
  });

  it("clears old validation and network errors on retries and can succeed", async () => {
    let resolveRetry;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ errors: [{ message: "Content is invalid" }] }, 400))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockReturnValueOnce(new Promise((resolve) => { resolveRetry = resolve; }));
    const user = renderForm();

    await user.type(screen.getByRole("textbox"), "My draft");
    await user.click(screen.getByRole("button", { name: "Add Comment" }));
    expect(await screen.findByText("Content is invalid")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Comment" }));
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText("Content is invalid")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Updated comment");
    await user.click(screen.getByRole("button", { name: "Add Comment" }));
    expect(screen.getByText("Sending...")).toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();

    await act(async () => {
      resolveRetry(jsonResponse({ comment: { cuid: "comment-1" } }));
    });

    expect(screen.getByText("Comment created")).toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.queryByText("Content is invalid")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ content: "Updated comment" });
  });
});
