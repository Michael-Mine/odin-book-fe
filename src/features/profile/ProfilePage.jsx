import { useState } from "react";
import { useParams } from "react-router";
import useProfile from "./useProfile";
import UnfollowButton from "../follow/UnfollowButton";
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

      {userProfile.relationshipStatus === "ACCEPTED" && (
        <p>You are following {userProfile.name}</p>
      )}
      {userProfile.relationshipStatus === "PENDING" && (
        <p>Your follow request is pending with {userProfile.name}</p>
      )}

      <img
        src={userProfile.picURL}
        className={styles.profilePic}
        alt="profile pic"
      />

      <p>
        {userProfile.followerCount} Followers • {userProfile.followingCount}{" "}
        Following{" "}
      </p>

      {userProfile.isOwnProfile && (
        <p className={styles.gravatarText}>
          Use Gravatar to update your profile picture
        </p>
      )}

      {userProfile.relationshipStatus === "ACCEPTED" && (
        <UnfollowButton userCuid={userCuid} />
      )}
      {!userProfile.isOwnProfile && !userProfile.relationshipStatus && (
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
