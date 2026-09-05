import { Link } from "react-router";
import styles from "./ProfileUserList.module.css";

function ProfileUserList({ heading, users, emptyMessage }) {
  if (!users) return null;

  if (users.length === 0) {
    return <p className={styles.emptyMessage}>{emptyMessage}</p>;
  }

  return (
    <>
      <span className={styles.heading}>{heading}:</span>

      {users.map((user) => (
        <Link
          to={`/profile/${user.cuid}`}
          key={user.cuid}
          className={styles.profileLink}
        >
          <span>{user.name}</span>
        </Link>
      ))}
    </>
  );
}

export default ProfileUserList;
