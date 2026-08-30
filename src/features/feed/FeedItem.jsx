import { useState } from "react";
import { Link } from "react-router";
import formatDate from "../../utils/formatDate";
import styles from "./FeedItem.module.css";

function FeedItem({ post }) {
  const [seeMore, setSeeMore] = useState(false);
  const profileURL = `/profile/${post.author.cuid}`;
  const postURL = `/post/${post.cuid}`;
  const date = formatDate(post.createdAt);

  return (
    <div className={styles.container}>
      <Link to={profileURL} className={styles.profileLink}>
        <h2>{post.author.name}</h2>
      </Link>
      <b>
        <p className={styles.date}>
          {date.toDateString() +
            " at " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </b>
      {post.content.length <= 200 || seeMore ? (
        <p>{post.content}</p>
      ) : (
        <>
          <p>{post.content.slice(0, 200)}...</p>
          <button onClick={() => setSeeMore(true)}>See more</button>
        </>
      )}
      <button>{post.commentCount} Likes</button>
      <Link to={postURL} className={styles.link}>
        {post.commentCount} Comments
      </Link>
    </div>
  );
}

export default FeedItem;

// add profile pics and post pics?
