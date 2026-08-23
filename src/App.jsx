import { Outlet } from "react-router";
import useUser from "./pages/useUser";
import Navbar from "./layouts/Navbar";
import Login from "./features/auth/Login";
import Footer from "./layouts/Footer";
import "./styles/button.css";
import "./styles/input.css";

function App() {
  const { user, setUser, error, loading } = useUser();
  console.log(user);

  return (
    <>
      <Navbar />
      {loading && <h2>Loading...</h2>}
      {error && <h2>Error loading user, please login again.</h2>}
      {user ? (
        <Outlet context={{ user, setUser }} />
      ) : (
        <Login setUser={setUser} />
      )}
      <Footer />
    </>
  );
}

export default App;
