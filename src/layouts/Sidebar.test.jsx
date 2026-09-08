import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Sidebar from "./Sidebar";
import styles from "./Sidebar.module.css";

describe("Sidebar", () => {
  const user = { cuid: "user-123" };
  const destinations = [
    ["Home", "/"],
    ["New Follows", "/new-follows"],
    ["New Post", "/new-post"],
    ["My Profile", `/profile/${user.cuid}`],
  ];

  function renderSidebar(path = "/") {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Sidebar user={user} />
      </MemoryRouter>,
    );
  }

  it("renders navigation links with the correct destinations", () => {
    renderSidebar();

    const navigation = within(screen.getByRole("navigation"));
    expect(navigation.getAllByRole("link")).toHaveLength(4);

    for (const [name, href] of destinations) {
      expect(navigation.getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it.each(destinations)(
    "marks only %s as active at %s",
    (activeName, path) => {
      renderSidebar(path);

      for (const [name] of destinations) {
        const link = screen.getByRole("link", { name });
        expect(link).toHaveClass(styles.link);

        if (name === activeName) {
          expect(link).toHaveAttribute("aria-current", "page");
          expect(link).toHaveClass(styles.active);
        } else {
          expect(link).not.toHaveAttribute("aria-current");
          expect(link).not.toHaveClass(styles.active);
        }
      }
    },
  );

  it("does not mark My Profile as active on another user's profile", () => {
    renderSidebar("/profile/user-456");

    const profileLink = screen.getByRole("link", { name: "My Profile" });
    expect(profileLink).toHaveAttribute("href", "/profile/user-123");
    expect(profileLink).not.toHaveAttribute("aria-current");
    expect(profileLink).not.toHaveClass(styles.active);
  });
});
