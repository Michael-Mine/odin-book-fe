import { Outlet } from "react-router";
import useUser from "./hooks/useUser";
import Navbar from "./layouts/Navbar";
import Footer from "./layouts/Footer";
import styles from "./App.module.css";
import "./styles/button.css";
import "./styles/input.css";

function App() {
  const auth = useUser();

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.main}>
        <Outlet context={auth} />
      </div>
      <Footer />
    </div>
  );
}

export default App;
