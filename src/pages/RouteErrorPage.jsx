import { isRouteErrorResponse, Link, useRouteError } from "react-router";

function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <main>
        <h1>{error.status}</h1>
        <p>{error.statusText || "The request could not be completed."}</p>
        <Link to="/">Return home</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred. Please try again.</p>
      <Link to="/">Return home</Link>
    </main>
  );
}

export default RouteErrorPage;
