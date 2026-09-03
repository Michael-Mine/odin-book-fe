import { Link } from "react-router";
import useUsersFollowsSent from "./useUsersFollowsSent";
import styles from "./FollowsSent.module.css";

function FollowsSent() {
  const { usersFollowsSent, error, loading } = useUsersFollowsSent();

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;
  if (!usersFollowsSent) return <h2>Users not found</h2>;
  if (usersFollowsSent === 0) return <h2>No Follows Sent Pending</h2>;

  return (
    <>
      <h2>New Follow Requests</h2>
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
            <button>Cancel</button>
          </div>
        ))}
      </div>
    </>
  );
}

export default FollowsSent;
