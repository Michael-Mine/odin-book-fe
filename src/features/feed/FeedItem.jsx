import { useState } from "react";
import { Link } from "react-router";
import PostHeader from "../posts/PostHeader";
import LikeButton from "../likes/LikeButton";
import styles from "./FeedItem.module.css";

function FeedItem({ post }) {
  const [seeMore, setSeeMore] = useState(false);
  const postURL = `/post/${post.cuid}`;

  return (
    <div className={styles.container}>
      <PostHeader post={post} />
      {post.content.length <= 200 || seeMore ? (
        <p>{post.content}</p>
      ) : (
        <>
          <p>{post.content.slice(0, 200)}...</p>
          <button onClick={() => setSeeMore(true)}>See more</button>
        </>
      )}
      <LikeButton likeCount={post.likeCount} postCuid={post.cuid} />
      <Link to={postURL} className={styles.link}>
        {post.commentCount} Comments
      </Link>
    </div>
  );
}

export default FeedItem;
