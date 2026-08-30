import { NavLink } from "react-router";
import styles from "./Sidebar.module.css";

function Sidebar({ user }) {
  const profileURL = `/profile/${user.cuid}`;
  const linkClass = ({ isActive }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <aside className={styles.container}>
      <nav className={styles.navigation}>
        <NavLink to="/" end className={linkClass}>
          Home
        </NavLink>

        <NavLink to="/new-post" className={linkClass}>
          New Post
        </NavLink>

        <NavLink to="/following" className={linkClass}>
          New Follows
        </NavLink>

        <NavLink to={profileURL} className={linkClass}>
          My Profile
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
