import { useEffect, useState } from "react";

const useUser = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("getting user");
    fetch(`${apiUrl}v1/auth/session`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        return response.json();
      })
      .then((response) => setUser(response.user))
      .catch((error) => setError(error))
      .finally(() => setLoading(false));
  }, []);

  return { user, setUser, error, loading };
};

export default useUser;
