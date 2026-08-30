import { Link } from "react-router";
import formatDate from "../../utils/formatDate";
import styles from "./CommentsItem.module.css";

function CommentsItem({ comment }) {
  const profileURL = `/profile/${comment.author.cuid}`;
  const date = formatDate(comment.createdAt);

  return (
    <div className={styles.container}>
      <div className={styles.heading}>
        <Link to={profileURL} className={styles.profileLink}>
          <p>{comment.author.name}</p>
        </Link>
        <p className={styles.date}>
          on{" "}
          {date.toDateString() +
            " at " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <p>{comment.content}</p>
    </div>
  );
}

export default CommentsItem;
