import { useState } from "react";
import { useParams } from "react-router";
import useProfile from "./useProfile";
import FollowRequestButton from "../follow/FollowRequestButton";
import AboutEdit from "./AboutEdit";
import ProfileTabs from "./ProfileTabs";
import styles from "./ProfilePage.module.css";

function Profile() {
  let { userCuid } = useParams();
  const { userProfile, error, loading } = useProfile(userCuid);
  const [showAboutEdit, setShowAboutEdit] = useState(false);

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>A network error was encountered</h2>;
  if (!userProfile) return <h2>User not found</h2>;

  return (
    <div className={styles.container}>
      <h2>{userProfile.name} Profile</h2>
      <h2>Photo + change if own</h2>
      <p>
        {userProfile.followerCount} Followers • {userProfile.followingCount}{" "}
        Following{" "}
      </p>

      {userProfile.relationshipStatus == "accepted" && (
        <p>You are following {userProfile.name}</p>
      )}
      {userProfile.relationshipStatus == "pending" && (
        <p>Your follow request is pending with {userProfile.name}</p>
      )}
      {!userProfile.relationshipStatus && (
        <FollowRequestButton userCuid={userCuid} />
      )}

      <div className={styles.aboutContainer}>
        <h3 className={styles.aboutHeading}>About</h3>
        {userProfile.isOwnProfile && (
          <button onClick={() => setShowAboutEdit(!showAboutEdit)}>Edit</button>
        )}
      </div>
      {userProfile.bio ? (
        <p className={styles.aboutText}>{userProfile.bio}</p>
      ) : (
        <p className={styles.aboutText}>Not updated</p>
      )}
      {showAboutEdit && <AboutEdit currentBio={userProfile.bio} />}
      <ProfileTabs key={userCuid} userCuid={userCuid} />
    </div>
  );
}

export default Profile;
