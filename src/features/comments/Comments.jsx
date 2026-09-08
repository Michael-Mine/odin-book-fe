import { useParams } from "react-router";
import useComments from "./useComments";
import CommentsItem from "./CommentsItem";
import WriteComment from "./WriteComment";
import styles from "./Comments.module.css";

function Comments() {
  let { postCuid } = useParams();
  const { comments, error, loading } = useComments(postCuid);

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;

  return (
    <>
      <h3 className={styles.heading}>Comments</h3>
      <div className={styles.container}>
        {comments.length === 0 ? (
          <p>No comments yet</p>
        ) : (
          comments.map((comment) => (
            <CommentsItem key={comment.cuid} comment={comment} />
          ))
        )}
        <WriteComment />
      </div>
    </>
  );
}

export default Comments;
