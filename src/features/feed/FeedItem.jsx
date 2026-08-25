import { Link } from "react-router";
import formatDate from "../../utils/formatDate";
import styles from "./FeedItem.module.css";

function FeedItem({ post }) {
  const url = `/post/${post.cuid}`;
  const date = formatDate(post.createdAt);
  const content = post.content;

  return (
    <div className={styles.container}>
      <h2>{post.author.name}</h2>
      <h3>{date.toDateString() + " at " + date.toLocaleTimeString()}</h3>
      <p>{content.slice(0, 200)}...</p>
      <button>See more</button>
      <Link to={url}>Comments</Link>
    </div>
  );
}

export default FeedItem;
