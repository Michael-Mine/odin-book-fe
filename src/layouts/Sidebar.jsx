import styles from "./Sidebar.module.css";

function Sidebar() {
  return (
    <div className={styles.container}>
      <button>Home</button>
      <button>New Post</button>
      <button>Following</button>
      <button>Profile</button>
    </div>
  );
}

export default Sidebar;
