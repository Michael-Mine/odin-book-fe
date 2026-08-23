import { Outlet } from "react-router";
import useUser from "./hooks/useUser";
import Navbar from "./layouts/Navbar";
import Footer from "./layouts/Footer";
import "./styles/button.css";
import "./styles/input.css";

function App() {
  const auth = useUser();

  return (
    <>
      <Navbar />
      <Outlet context={auth} />
      <Footer />
    </>
  );
}

export default App;
