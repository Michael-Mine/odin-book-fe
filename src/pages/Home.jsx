import { useOutletContext } from "react-router";
import styles from "./Home.module.css";

function Home() {
  const { user } = useOutletContext();

  return (
    <div className={styles.container}>
      <h2>Home Feed for {user.name}</h2>
    </div>
  );
}

export default Home;
