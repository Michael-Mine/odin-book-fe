import { useEffect, useState } from "react";

const useProfile = (userCuid) => {
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousUserCuid, setPreviousUserCuid] = useState(userCuid);

  if (userCuid !== previousUserCuid) {
    setPreviousUserCuid(userCuid);
    setUserProfile(null);
    setError(null);
    setLoading(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    const apiUrl = import.meta.env.VITE_API_URL;

    fetch(`${apiUrl}v1/users/${userCuid}`, {
      method: "GET",
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        return response.json();
      })
      .then((response) => {
        if (!controller.signal.aborted) {
          setUserProfile(response.user);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setError(error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [userCuid]);

  return { userProfile, error, loading };
};

export default useProfile;
