import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ErrorPage from "./Error-404";

describe("error 404 page", () => {
  it("renders 404", () => {
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    const heading = screen.getByRole("heading", {
      name: "Oh no, this route doesn't exist!",
    });

    expect(heading).toBeInTheDocument();
  });
});
