import { Link } from "react-router";
import useUsersToFollow from "./useUsersToFollow";
import styles from "./UserList.module.css";

function UserList() {
  const { usersToFollow, error, loading } = useUsersToFollow();

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;
  if (!usersToFollow) return <h2>Users not found</h2>;

  return (
    <>
      <h2>Find People to Connect</h2>
      <div className={styles.listContainer}>
        {usersToFollow.map((user) => (
          <div>
            <Link
              to={`/profile/${user.cuid}`}
              key={user.cuid}
              className={styles.profileLink}
            >
              <span>{user.name}</span>
            </Link>
            <button>Follow</button>
          </div>
        ))}
      </div>
    </>
  );
}

export default UserList;
