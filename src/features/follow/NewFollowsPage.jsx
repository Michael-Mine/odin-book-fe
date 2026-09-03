import styles from "./NewFollowsPage.module.css";
import UserList from "./UserList";

function NewFollowsPage() {
  return (
    <div className={styles.container}>
      <h2>show received requests + buttons to accept/reject</h2>
      <h2>show pending requests sent + button to cancel</h2>
      <UserList />
    </div>
  );
}
export default NewFollowsPage;
