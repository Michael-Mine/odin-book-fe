import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import RouteErrorPage from "./RouteErrorPage";

function renderRouteError(error) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <h1>Home page</h1> },
      {
        path: "/broken",
        loader: () => {
          throw error;
        },
        element: <h1>Broken page</h1>,
        errorElement: <RouteErrorPage />,
        hydrateFallbackElement: <p>Loading...</p>,
      },
    ],
    { initialEntries: ["/broken"] },
  );

  render(<RouterProvider router={router} />);
}

describe("RouteErrorPage", () => {
  it("displays the status and status text of a route error response", async () => {
    renderRouteError(
      new Response(null, { status: 404, statusText: "Not Found" }),
    );

    expect(
      await screen.findByRole("heading", { name: "404" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Not Found")).toBeInTheDocument();
  });

  it("displays a fallback message when the route error has no status text", async () => {
    renderRouteError(new Response(null, { status: 500, statusText: "" }));

    expect(
      await screen.findByRole("heading", { name: "500" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The request could not be completed."),
    ).toBeInTheDocument();
  });

  it("displays a generic message for an unexpected error", async () => {
    renderRouteError(new Error("Database failed"));

    expect(
      await screen.findByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Database failed")).not.toBeInTheDocument();
  });

  it.each([
    ["a route error response", () => new Response(null, { status: 404 })],
    ["an unexpected error", () => new Error("Database failed")],
  ])("returns home from %s", async (_description, createError) => {
    const user = userEvent.setup();
    renderRouteError(createError());

    const link = await screen.findByRole("link", { name: "Return home" });
    expect(link).toHaveAttribute("href", "/");

    await user.click(link);

    expect(
      await screen.findByRole("heading", { name: "Home page" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Return home" }),
    ).not.toBeInTheDocument();
  });
});
