import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useOutletContext } from "react-router";
import App from "./App";
import useUser from "./hooks/useUser";

vi.mock("./hooks/useUser");

// A child route that uses the context supplied by App.
function TestPage() {
  const { user, setUser, loading, error } = useOutletContext();

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert">{error.message}</p>;

  return (
    <main>
      <h1>Hello, {user.name}</h1>
      <button onClick={() => setUser(null)}>Clear user</button>
    </main>
  );
}

describe("App", () => {
  it("renders the layout and supplies auth context to its child route", async () => {
    const user = userEvent.setup();
    const setUser = vi.fn();

    useUser.mockReturnValue({
      user: { name: "Michael" },
      setUser,
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<TestPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Hello, Michael" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear user" }));

    expect(setUser).toHaveBeenCalledWith(null);
  });
});
