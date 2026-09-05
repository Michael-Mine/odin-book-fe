import { Link } from "react-router";
import useUsersFollowsSent from "./useUsersFollowsSent";
import FollowCancelButton from "./FollowCancelButton";
import styles from "./FollowsSent.module.css";

function FollowsSent() {
  const { usersFollowsSent, error, loading } = useUsersFollowsSent();

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;
  if (!usersFollowsSent) return <h2>Users not found</h2>;
  if (usersFollowsSent.length === 0) return <h2>No Pending Follows Sent</h2>;

  return (
    <>
      <h2>Pending Follows Sent</h2>
      <div className={styles.listContainer}>
        {usersFollowsSent.map((user) => (
          <div>
            <Link
              to={`/profile/${user.cuid}`}
              key={user.cuid}
              className={styles.profileLink}
            >
              <span>{user.name}</span>
            </Link>
            <FollowCancelButton userCuid={user.cuid} />
          </div>
        ))}
      </div>
    </>
  );
}

export default FollowsSent;
