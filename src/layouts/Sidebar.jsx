import { Link } from "react-router";
import styles from "./Sidebar.module.css";

function Sidebar() {
  return (
    <div className={styles.container}>
      <Link to="/">
        <button>Home</button>
      </Link>
      <Link to="/new-post">
        <button>New Post</button>
      </Link>
      <button>Following</button>
      <button>Profile</button>
    </div>
  );
}

export default Sidebar;
