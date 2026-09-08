import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LikeButton from "./LikeButton";

function successResponse() {
  return {
    ok: true,
    json: () => Promise.resolve({ like: { cuid: "like-1" } }),
  };
}

function renderButton(likeCount = 2) {
  render(<LikeButton likeCount={likeCount} postCuid="post-123" />);
  return userEvent.setup();
}

describe("LikeButton", () => {
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

  it.each([
    [0, "0 Likes"],
    [1, "1 Like"],
    [3, "3 Likes"],
  ])("renders count %i as %s without fetching", (count, label) => {
    renderButton(count);

    expect(screen.getByRole("button", { name: label })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to the specified post with credentials and disables the successful button", async () => {
    fetchMock.mockResolvedValue(successResponse());
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "2 Likes" }));

    const likedButton = await screen.findByRole("button", { name: "Liked" });
    expect(likedButton).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "https://api.example.com/v1/posts/post-123/likes",
      { method: "POST", credentials: "include" },
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(likedButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows Liking and prevents additional submissions while pending", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "2 Likes" }));

    const pendingButton = screen.getByRole("button", { name: "Liking..." });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([401, 404, 500])("shows an alert and restores the button for HTTP %i", async (status) => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status, json });
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "2 Likes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to like this post. Please try again.",
    );
    expect(screen.getByRole("button", { name: "2 Likes" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Liked" })).not.toBeInTheDocument();
    expect(json).not.toHaveBeenCalled();
  });

  it.each(["network", "JSON parsing"])("restores the button after a %s failure", async (failure) => {
    if (failure === "network") {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    } else {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError("Invalid JSON")),
      });
    }
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "2 Likes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to like this post. Please try again.",
    );
    expect(screen.getByRole("button", { name: "2 Likes" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Liking..." })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Liked" })).not.toBeInTheDocument();
  });

  it("clears the error during retry and can finish successfully", async () => {
    let resolveRetry;
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockReturnValueOnce(new Promise((resolve) => { resolveRetry = resolve; }));
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "2 Likes" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2 Likes" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Liking..." })).toBeDisabled();

    await act(async () => {
      resolveRetry(successResponse());
    });

    expect(screen.getByRole("button", { name: "Liked" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
