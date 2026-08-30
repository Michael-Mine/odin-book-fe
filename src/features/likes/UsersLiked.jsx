import { Link } from "react-router";
import styles from "./UsersLiked.module.css";

function UsersLiked({ likes }) {
  return (
    <div className={styles.container}>
      <span className={styles.heading}>Users Liked:</span>
      {likes.map((like) => (
        <Link
          to={`/profile/${like.user.cuid}`}
          key={like.user.cuid}
          className={styles.profileLink}
        >
          <span>{like.user.name}</span>
        </Link>
      ))}
    </div>
  );
}

export default UsersLiked;
