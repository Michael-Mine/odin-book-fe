import { Link } from "react-router";

const NotFound = () => {
  return (
    <main>
      <h1>404 — Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link to="/">Return home</Link>
    </main>
  );
};

export default NotFound;
