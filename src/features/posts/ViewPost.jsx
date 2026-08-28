import { useParams } from "react-router";
import usePost from "./usePost";
import formatDate from "../../utils/formatDate";
import styles from "./ViewPost.module.css";

function ViewPost() {
  let { postCuid } = useParams();
  const { post, error, loading } = usePost(postCuid);

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;
  if (!post) return <h2>Post not found</h2>;

  const date = formatDate(post.createdAt);

  return (
    <div className={styles.container}>
      <h2>{post.author.name}'s Post</h2>
      <b>
        <p className={styles.date}>
          {date.toDateString() +
            " at " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </b>
      <p>{post.content}</p>
      <button>{post.commentCount} Likes</button>
      <button>Show Likes</button>
    </div>
  );
}

export default ViewPost;
