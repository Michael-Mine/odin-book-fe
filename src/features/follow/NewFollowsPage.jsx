import FollowsReceived from "./FollowsReceived";
import styles from "./NewFollowsPage.module.css";
import UserList from "./UserList";

function NewFollowsPage() {
  return (
    <div className={styles.container}>
      <FollowsReceived />
      <h2>show pending requests sent + button to cancel</h2>
      <UserList />
    </div>
  );
}
export default NewFollowsPage;
