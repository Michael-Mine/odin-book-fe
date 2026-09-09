import { Link } from "react-router";
import useUsersToFollow from "./useUsersToFollow";
import FollowRequestButton from "./FollowRequestButton";
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
          <div key={user.cuid} className={styles.listItemContainer}>
            <div>
              <img src={user.picURL} alt="profile pic" />
            </div>
            <Link to={`/profile/${user.cuid}`} className={styles.profileLink}>
              <span>{user.name}</span>
            </Link>
            <FollowRequestButton userCuid={user.cuid} />
          </div>
        ))}
      </div>
    </>
  );
}

export default UserList;
