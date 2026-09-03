import { useState } from "react";

function AboutEdit({ currentBio }) {
  const [formData, setFormData] = useState({
    bio: currentBio,
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addPost = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const url = `${apiUrl}v1/users/me`;
    setSending(true);
    setError(null);

    fetch(url, {
      method: "PUT",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error))
      .finally(() => setSending(false));
  };

  if (sending) {
    return <h3>Sending...</h3>;
  }

  if (response && response.user) {
    return <h3>About Updated</h3>;
  }

  return (
    <div>
      <h3>Edit About - max 160 characters</h3>
      <textarea
        className="input-field bio"
        data-testid="content-input"
        type="text"
        name="bio"
        placeholder="Write post"
        value={formData.bio}
        onChange={handleChange}
        maxLength="160"
      />
      <div>
        <button onClick={addPost}>Update</button>
      </div>
      {error && <h3>A network error was encountered</h3>}
      {response &&
        response.errors &&
        response.errors.map((error) => {
          return <h3>{error.message}</h3>;
        })}
    </div>
  );
}

export default AboutEdit;
