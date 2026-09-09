import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import ProfileTabs from "./ProfileTabs";

vi.mock("../feed/FeedItem", () => ({
  default: ({ post }) => <article>{post.content}</article>,
}));

const tabs = [
  {
    name: "Posts",
    endpoint: "posts",
    data: { posts: [{ cuid: "post-1", content: "First post" }, { cuid: "post-2", content: "Second post" }] },
    emptyData: { posts: [] },
    content: "First post",
    empty: "No posts yet.",
  },
  {
    name: "Followers",
    endpoint: "followers",
    data: { followers: [{ follower: { cuid: "follower-1", name: "Alice" } }] },
    emptyData: { followers: [] },
    content: "Alice",
    empty: "No followers yet.",
    link: "/profile/follower-1",
  },
  {
    name: "Following",
    endpoint: "following",
    data: { following: [{ following: { cuid: "following-1", name: "Bob" } }] },
    emptyData: { following: [] },
    content: "Bob",
    empty: "Not following anyone yet.",
    link: "/profile/following-1",
  },
];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function response(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

function renderTabs() {
  return render(<MemoryRouter><ProfileTabs userCuid="profile-1" /></MemoryRouter>);
}

const errorMessage = "A network error was encountered";

describe("ProfileTabs", () => {
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

  it("starts with no selected tab and does not fetch", () => {
    renderTabs();
    for (const tab of tabs) {
      expect(screen.getByRole("button", { name: tab.name })).toHaveAttribute("aria-pressed", "false");
      expect(screen.queryByText(tab.empty)).not.toBeInTheDocument();
    }
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(tabs)("loads $name with the correct request and renders its response", async (tab) => {
    const user = userEvent.setup();
    const request = deferred();
    fetchMock.mockReturnValue(request.promise);
    renderTabs();

    await user.click(screen.getByRole("button", { name: tab.name }));
    for (const candidate of tabs) {
      expect(screen.getByRole("button", { name: candidate.name })).toHaveAttribute("aria-pressed", String(candidate === tab));
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`https://api.example.com/v1/users/profile-1/${tab.endpoint}`, {
      method: "GET",
      credentials: "include",
      signal: expect.any(AbortSignal),
    });
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText(tab.empty)).not.toBeInTheDocument();

    await act(async () => request.resolve(response(tab.data)));
    expect(screen.getByText(tab.content)).toBeInTheDocument();
    if (tab.link) {
      expect(screen.getByRole("link", { name: tab.content })).toHaveAttribute("href", tab.link);
      expect(screen.getByText(`${tab.name}:`)).toBeInTheDocument();
    } else {
      expect(screen.getByText("Second post")).toBeInTheDocument();
      expect(screen.getAllByRole("article")).toHaveLength(2);
    }
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  });

  for (const empty of [false, true]) {
    it.each(tabs)(`caches ${empty ? "empty" : "populated"} $name results when switching away and back`, async (tab) => {
      const user = userEvent.setup();
      const other = tabs.find((candidate) => candidate !== tab);
      const visible = empty ? tab.empty : tab.content;
      fetchMock
        .mockResolvedValueOnce(response(empty ? tab.emptyData : tab.data))
        .mockResolvedValueOnce(response(other.data));
      renderTabs();

      await user.click(screen.getByRole("button", { name: tab.name }));
      expect(await screen.findByText(visible)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: other.name }));
      expect(await screen.findByText(other.content)).toBeInTheDocument();
      expect(screen.queryByText(visible)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: tab.name }));
      expect(screen.getByText(visible)).toBeInTheDocument();
      expect(screen.queryByText(other.content)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: tab.name })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: other.name })).toHaveAttribute("aria-pressed", "false");
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  }

  it.each([401, 500])("handles HTTP %i without parsing the response", async (status) => {
    const user = userEvent.setup();
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status, json });
    renderTabs();
    await user.click(screen.getByRole("button", { name: "Posts" }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText(tabs[0].empty)).not.toBeInTheDocument();
    expect(json).not.toHaveBeenCalled();
  });

  it.each(["network", "JSON"])("handles a %s failure", async (failure) => {
    const user = userEvent.setup();
    if (failure === "network") {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    } else {
      fetchMock.mockResolvedValue({ ok: true, json: () => Promise.reject(new SyntaxError("Invalid JSON")) });
    }
    renderTabs();
    await user.click(screen.getByRole("button", { name: "Followers" }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText(tabs[1].empty)).not.toBeInTheDocument();
  });

  it("retries a failed tab and clears its error", async () => {
    const user = userEvent.setup();
    const retry = deferred();
    fetchMock.mockRejectedValueOnce(new Error("Offline")).mockReturnValueOnce(retry.promise);
    renderTabs();
    await user.click(screen.getByRole("button", { name: "Following" }));
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Following" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => retry.resolve(response(tabs[2].data)));
    expect(screen.getByRole("link", { name: "Bob" })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("ignores AbortError and finishes loading", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    renderTabs();
    await user.click(screen.getByRole("button", { name: "Posts" }));
    await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.queryByText(tabs[0].empty)).not.toBeInTheDocument();
  });

  it.each(["success", "error"])("ignores a cancelled request's late %s while another tab loads", async (outcome) => {
    const user = userEvent.setup();
    const oldRequest = deferred();
    const nextRequest = deferred();
    fetchMock.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(nextRequest.promise);
    renderTabs();
    await user.click(screen.getByRole("button", { name: "Posts" }));
    const oldSignal = fetchMock.mock.calls[0][1].signal;
    await user.click(screen.getByRole("button", { name: "Followers" }));
    expect(oldSignal.aborted).toBe(true);
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(false);

    await act(async () => {
      if (outcome === "success") oldRequest.resolve(response(tabs[0].data));
      else oldRequest.reject(new Error("Late failure"));
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.queryByText("First post")).not.toBeInTheDocument();

    await act(async () => nextRequest.resolve(response(tabs[1].data)));
    expect(screen.getByRole("link", { name: "Alice" })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();

    // The cancelled result must not populate the old tab's cache.
    fetchMock.mockResolvedValueOnce(response(tabs[0].emptyData));
    await user.click(screen.getByRole("button", { name: "Posts" }));
    expect(await screen.findByText("No posts yet.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ignores old JSON that finishes after a replacement request for the same tab", async () => {
    const user = userEvent.setup();
    const oldJson = deferred();
    const json = vi.fn(() => oldJson.promise);
    fetchMock.mockResolvedValueOnce({ ok: true, json }).mockResolvedValueOnce(response(tabs[0].data));
    renderTabs();
    await user.click(screen.getByRole("button", { name: "Posts" }));
    await waitFor(() => expect(json).toHaveBeenCalledOnce());
    await user.click(screen.getByRole("button", { name: "Posts" }));
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(await screen.findByText("First post")).toBeInTheDocument();

    await act(async () => oldJson.resolve({ posts: [{ cuid: "old", content: "Stale post" }] }));
    expect(screen.getByText("First post")).toBeInTheDocument();
    expect(screen.queryByText("Stale post")).not.toBeInTheDocument();
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("aborts a pending request when returning to a cached tab", async () => {
    const user = userEvent.setup();
    const pending = deferred();
    fetchMock.mockResolvedValueOnce(response(tabs[0].data)).mockReturnValueOnce(pending.promise);
    renderTabs();
    await user.click(screen.getByRole("button", { name: "Posts" }));
    expect(await screen.findByText("First post")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Followers" }));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Posts" }));

    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("First post")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    await act(async () => pending.reject(new Error("Late failure")));
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.getByText("First post")).toBeInTheDocument();
  });

  it("clears an error when switching to cached content", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(response(tabs[0].data)).mockRejectedValueOnce(new Error("Offline"));
    renderTabs();
    await user.click(screen.getByRole("button", { name: "Posts" }));
    expect(await screen.findByText("First post")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Followers" }));
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Posts" }));
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(screen.getByText("First post")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("aborts the pending request on unmount", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderTabs();
    await user.click(screen.getByRole("button", { name: "Posts" }));
    const signal = fetchMock.mock.calls[0][1].signal;
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
