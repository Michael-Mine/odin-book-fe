import styles from "./Sidebar.module.css";

function Sidebar() {
  return (
    <div className={styles.container}>
      <button>Home</button>
      <button>Profile</button>
      <button>Following</button>
      <button>New Post</button>
    </div>
  );
}

export default Sidebar;
