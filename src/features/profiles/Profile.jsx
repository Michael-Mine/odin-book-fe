import { useOutletContext, useParams } from "react-router";
import useProfile from "./useProfile";
import styles from "./Profile.module.css";

function Profile() {
  let { userCuid } = useParams();
  const { user } = useOutletContext();
  // const { userProfile, error, loading } = useProfile(userCuid);

  // if (loading) return <h2>Loading...</h2>;
  // if (error) return <h2>A network error was encountered</h2>;
  // if (!userProfile) return <h2>User not found</h2>;

  return (
    <div className={styles.container}>
      <h2>userName Profile</h2>
      <h2>Photo</h2>
      <h2>Bio</h2>
      <h2>Posts</h2>
      <h2>Followers?</h2>
      <h2>Following?</h2>
    </div>
  );
}

export default Profile;
