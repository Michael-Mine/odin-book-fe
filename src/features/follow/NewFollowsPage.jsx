import FollowsReceived from "./FollowsReceived";
import FollowsSent from "./FollowsSent";
import UserList from "./UserList";
import styles from "./NewFollowsPage.module.css";

function NewFollowsPage() {
  return (
    <div className={styles.container}>
      <FollowsReceived />
      <FollowsSent />
      <UserList />
    </div>
  );
}
export default NewFollowsPage;
