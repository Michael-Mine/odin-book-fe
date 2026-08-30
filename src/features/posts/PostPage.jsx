import { useParams } from "react-router";
import usePost from "./usePost";
import PostHeader from "./PostHeader";
import Comments from "./Comments";
import styles from "./PostPage.module.css";

function PostPage() {
  let { postCuid } = useParams();
  const { post, error, loading } = usePost(postCuid);

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;
  if (!post) return <h2>Post not found</h2>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>{post.author.name}'s Post</h2>
      <PostHeader post={post} />
      <p>{post.content}</p>
      <button>{post.likeCount} Likes</button>
      <button>Show Likes</button>
      <Comments />
    </div>
  );
}

export default PostPage;
