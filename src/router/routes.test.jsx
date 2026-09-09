import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useOutletContext, useParams } from "react-router";
import routes from "./routes";

const pageState = vi.hoisted(() => ({ throwError: false }));

vi.mock("../features/feed/Feed", () => ({
  default: function Feed() {
    const user = useOutletContext();
    if (pageState.throwError) throw new Error("Page failed");
    return <h2>Feed for {user.name}</h2>;
  },
}));
vi.mock("../features/posts/NewPost", () => ({ default: () => <h2>New post page</h2> }));
vi.mock("../features/posts/PostPage", () => ({
  default: function PostPage() {
    const { postCuid } = useParams();
    return <h2>Post {postCuid}</h2>;
  },
}));
vi.mock("../features/profile/ProfilePage", () => ({
  default: function ProfilePage() {
    const { userCuid } = useParams();
    return <h2>Profile {userCuid}</h2>;
  },
}));
vi.mock("../features/follow/NewFollowsPage", () => ({ default: () => <h2>Follow requests page</h2> }));

const account = { cuid: "user-1", name: "Michael", picURL: "https://example.com/avatar.png" };
const pages = [
  { path: "/", heading: "Feed for Michael" },
  { path: "/new-post", heading: "New post page" },
  { path: "/post/post-123", heading: "Post post-123" },
  { path: "/profile/profile-456", heading: "Profile profile-456" },
  { path: "/new-follows", heading: "Follow requests page" },
];
const apiUrl = "https://api.example.com/";
const success = (data) => ({ ok: true, status: 200, json: () => Promise.resolve(data) });

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

const routers = [];
function renderRoute(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  routers.push(router);
  render(<RouterProvider router={router} />);
  return router;
}

describe("application routes", () => {
  let fetchMock;

  beforeEach(() => {
    pageState.throwError = false;
    fetchMock = vi.fn().mockRejectedValue(new Error("Unexpected request"));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_API_URL", apiUrl);
  });

  afterEach(() => {
    cleanup();
    for (const router of routers.splice(0)) router.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each(pages)("renders $path for an authenticated session", async ({ path, heading }) => {
    fetchMock.mockResolvedValueOnce(success({ user: account }));
    const router = renderRoute(path);

    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute("href", "/profile/user-1");
    expect(router.state.location.pathname).toBe(path);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${apiUrl}v1/auth/session`, {
      method: "GET", credentials: "include", signal: expect.any(AbortSignal),
    });
  });

  it.each(pages)("protects $path and preserves the requested location", async ({ path, heading }) => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    const router = renderRoute(`${path}?draft=123#editor`);

    expect(await screen.findByRole("heading", { name: "Login to access" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: heading })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(router.state.location.state.from).toMatchObject({ pathname: path, search: "?draft=123", hash: "#editor" });
  });

  it("waits for the session before rendering or redirecting a protected route", async () => {
    const session = deferred();
    fetchMock.mockReturnValueOnce(session.promise);
    const router = renderRoute("/new-post");

    expect(screen.getByRole("heading", { name: "Loading..." })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "New post page" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Login to access" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/new-post");
    await act(async () => session.resolve(success({ user: account })));
    expect(screen.getByRole("heading", { name: "New post page" })).toBeInTheDocument();
  });

  it("shows a session error without exposing protected content or redirecting", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Offline"));
    const router = renderRoute("/new-post");

    expect(await screen.findByRole("heading", { name: /Unable to check your session/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "New post page" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Login to access" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/new-post");
  });

  it("logs in through real auth state and returns to the full requested URL", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce(success({ user: account }));
    const user = userEvent.setup();
    const router = renderRoute("/new-post?draft=123#editor");
    await screen.findByRole("heading", { name: "Login to access" });
    await user.type(screen.getByLabelText("Email:"), "mine@example.com");
    await user.type(screen.getByLabelText("Password:"), "test-password");
    await user.click(screen.getByRole("button", { name: "Login", exact: true }));

    expect(await screen.findByRole("heading", { name: "New post page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(router.state.location).toMatchObject({ pathname: "/new-post", search: "?draft=123", hash: "#editor" });
    expect(router.state.historyAction).toBe("REPLACE");
    expect(fetchMock).toHaveBeenLastCalledWith(`${apiUrl}v1/auth/login`, {
      method: "POST", credentials: "include", headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "mine@example.com", password: "test-password" }),
    });
  });

  it("keeps protected routes inaccessible after failed login", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({ message: "Invalid credentials" }) });
    const user = userEvent.setup();
    const router = renderRoute("/new-post");
    await screen.findByRole("heading", { name: "Login to access" });
    await user.click(screen.getByRole("button", { name: "Login", exact: true }));
    expect(await screen.findByText("Authentication failed")).toBeInTheDocument();
    await act(async () => router.navigate("/new-post"));
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.queryByRole("heading", { name: "New post page" })).not.toBeInTheDocument();
  });

  it("logs out and prevents subsequent access to protected routes", async () => {
    fetchMock.mockResolvedValueOnce(success({ user: account }))
      .mockResolvedValueOnce({ ok: true, status: 204 });
    const user = userEvent.setup();
    const router = renderRoute("/");
    await screen.findByRole("heading", { name: "Feed for Michael" });
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByRole("heading", { name: "Login to access" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Feed for Michael" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(`${apiUrl}v1/auth/logout`, { method: "POST", credentials: "include" });
    await act(async () => router.navigate("/new-post"));
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.queryByRole("heading", { name: "New post page" })).not.toBeInTheDocument();
  });

  it("keeps the authenticated page after logout fails and permits retry", async () => {
    fetchMock.mockResolvedValueOnce(success({ user: account }))
      .mockRejectedValueOnce(new TypeError("Offline"))
      .mockResolvedValueOnce({ ok: true, status: 204 });
    const user = userEvent.setup();
    const router = renderRoute("/");
    await screen.findByRole("heading", { name: "Feed for Michael" });
    await user.click(screen.getByRole("button", { name: "Logout" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to log out");
    expect(screen.getByRole("heading", { name: "Feed for Michael" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    await user.click(screen.getByRole("button", { name: "Logout" }));
    expect(await screen.findByRole("heading", { name: "Login to access" })).toBeInTheDocument();
  });

  it("renders the configured error page when a route component throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    pageState.throwError = true;
    fetchMock.mockResolvedValueOnce(success({ user: account }));
    renderRoute("/");

    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("heading", { name: "Feed for Michael" })).not.toBeInTheDocument();
  });
});
