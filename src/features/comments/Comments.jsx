import { useParams } from "react-router";
import useComments from "./useComments";
import CommentsItem from "./CommentsItem";
import styles from "./Comments.module.css";

function Comments() {
  let { postCuid } = useParams();
  const { comments, error, loading } = useComments(postCuid);

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;

  return (
    <div className={styles.container}>
      {comments.map((comment) => {
        return <CommentsItem key={comment.cuid} comment={comment} />;
      })}
    </div>
  );
}

export default Comments;
