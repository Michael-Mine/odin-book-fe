import Navbar from "./layouts/Navbar";
import Login from "./features/auth/Login";
import Footer from "./layouts/Footer";
import "./styles/button.css";
import "./styles/input.css";

function App() {
  return (
    <>
      <Navbar />
      <Login />
      <Footer />
    </>
  );
}

export default App;
