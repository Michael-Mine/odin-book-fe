import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Routes,
  Route,
  createMemoryRouter,
  RouterProvider,
} from "react-router";
import NotFound from "./NotFound";
import routes from "../router/routes";
import useUser from "../hooks/useUser";

vi.mock("../hooks/useUser");

describe("NotFound", () => {
  it("displays the heading, explanation, and return-home link", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "404 — Page not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The page you requested does not exist."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("navigates home when the return-home link is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <Routes>
          <Route path="/" element={<h1>Home page</h1>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: "Return home" }));

    expect(
      screen.getByRole("heading", { name: "Home page" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "404 — Page not found" }),
    ).not.toBeInTheDocument();
  });

  it("displays NotFound for an unknown URL through the app routes", () => {
    useUser.mockReturnValue({
      user: null,
      setUser: vi.fn(),
      loading: false,
      error: null,
    });

    const router = createMemoryRouter(routes, {
      initialEntries: ["/does-not-exist"],
    });

    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole("heading", { name: "404 — Page not found" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/does-not-exist");
  });
});
