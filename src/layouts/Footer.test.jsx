import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer component", () => {
  it("renders 3 links", () => {
    render(<Footer />);

    expect(screen.getAllByRole("link").length).toEqual(3);
  });

  it("renders 3 links with logos", () => {
    render(<Footer />);
    const { container } = render(<Footer />);

    expect(container).toMatchSnapshot();
  });

  it("links to my website", () => {
    render(<Footer />);

    expect(screen.getByTestId("my-site-link")).toHaveAttribute(
      "href",
      "https://mrmine.net/",
    );
  });
});
