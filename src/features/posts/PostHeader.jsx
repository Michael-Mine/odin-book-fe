import { Link } from "react-router";
import formatDate from "../../utils/formatDate";
import styles from "./PostHeader.module.css";

function PostHeader({ post }) {
  const profileURL = `/profile/${post.author.cuid}`;
  const date = formatDate(post.createdAt);

  return (
    <div className={styles.container}>
      <div>
        <img src={post.author.picURL} alt="profile pic" />
      </div>
      <div>
        <Link to={profileURL} className={styles.profileLink}>
          <h2>{post.author.name}</h2>
        </Link>
        <b>
          <p className={styles.date}>
            {date.toDateString() +
              " at " +
              date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
          </p>
        </b>
      </div>
    </div>
  );
}

export default PostHeader;

// add profile pics
