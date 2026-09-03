import { useEffect, useState } from "react";

const useUsersFollowReceived = () => {
  const [usersFollowReceived, setUsersFollowReceived] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("getting users to follow");

    fetch(`${apiUrl}v1/follow-requests/received`, {
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
      .then((response) => setUsersFollowReceived(response.users))
      .catch((error) => {
        if (error.name !== "AbortError") {
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
  }, []);

  return { usersFollowReceived, error, loading };
};

export default useUsersFollowReceived;
