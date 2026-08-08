import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Navbar from "./Navbar";

describe("NavBar component", () => {
  it("renders 3 links", () => {
    render(<Navbar />);

    expect(screen.getAllByRole("link").length).toEqual(3);
  });

  it("renders 3 links with logos", () => {
    render(<Navbar />);
    const { container } = render(<Navbar />);

    expect(container).toMatchSnapshot();
  });

  it("links to my website", () => {
    render(<Navbar />);

    expect(screen.getByTestId("my-site-link")).toHaveAttribute(
      "href",
      "https://mrmine.net/",
    );
  });

  it("links to my github page", () => {
    render(<Navbar />);

    expect(screen.getByTestId("github-link")).toHaveAttribute(
      "href",
      "https://github.com/Michael-Mine",
    );
  });
});
