import { Outlet } from "react-router";
import useUser from "./pages/useUser";
import Navbar from "./layouts/Navbar";
// import Login from "./features/auth/Login";
import Footer from "./layouts/Footer";
import "./styles/button.css";
import "./styles/input.css";

function App() {
  // const { user, setUser, error, loading } = useUser();
  // console.log(user);
  const auth = useUser();

  return (
    <>
      <Navbar />
      {/* {loading && <h2>Loading...</h2>}
      {error && <h2>Error loading user, please login again.</h2>}
      {user ? (
        <Outlet context={{ user, setUser }} />
      ) : (
        <Login setUser={setUser} />
      )} */}
      <Outlet context={auth} />
      <Footer />
    </>
  );
}

export default App;
