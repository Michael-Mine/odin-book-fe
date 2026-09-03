import { Link } from "react-router";
import useUsersFollowReceived from "./useUsersFollowReceived";
import styles from "./FollowsReceived.module.css";

function FollowsReceived() {
  const { usersFollowReceived, error, loading } = useUsersFollowReceived();

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;
  if (!usersFollowReceived) return <h2>Users not found</h2>;
  if (usersFollowReceived === 0) return <h2>No New Follow Requests</h2>;

  return (
    <>
      <h2>New Follow Requests</h2>
      <div className={styles.listContainer}>
        {usersFollowReceived.map((user) => (
          <div>
            <Link
              to={`/profile/${user.cuid}`}
              key={user.cuid}
              className={styles.profileLink}
            >
              <span>{user.name}</span>
            </Link>
            <button>Accept</button>
            <button>Reject</button>
            <button>Block</button>
          </div>
        ))}
      </div>
    </>
  );
}

export default FollowsReceived;
