import styles from "./NewFollowsPage.module.css";

function NewFollowsPage() {
  return (
    <div className={styles.container}>
      <h2>show received requests + buttons to accept/reject</h2>
      <h2>show pending requests sent + button to cancel</h2>
      <h2>List users not followed + button to follow</h2>
    </div>
  );
}
export default NewFollowsPage;
