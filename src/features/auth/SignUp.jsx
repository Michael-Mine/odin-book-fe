import { useState } from "react";

function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    passwordCheck: "",
  });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [signingUp, setSigningUp] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendSignUp = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("signing up");
    setSigningUp(true);

    fetch(`${apiUrl}v1/auth/sign-up`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((response) => setResponse({ ...response }))
      .catch((error) => setError(error))
      .finally(() => setSigningUp(false));
  };

  if (signingUp) return <h3>Signing Up...</h3>;
  if (response && response.user) return <h3>User created</h3>;

  return (
    <div>
      <h4>Sign Up Form</h4>
      <p>This app uses your profile picture with Gravatar from your email.</p>
      <p>If you do not have a Gravatar account, you can create one for free.</p>
      <div className="input-container">
        <label htmlFor="name">Name:</label>
        <input
          className="input-field"
          id="name"
          name="name"
          data-testid="name-input"
          type="text"
          value={formData.name}
          onChange={handleChange}
        />
        <label htmlFor="username">Email:</label>
        <input
          className="input-field"
          id="username"
          name="username"
          data-testid="username-input"
          type="email"
          value={formData.username}
          onChange={handleChange}
        />
      </div>
      <div className="input-container">
        <label htmlFor="password">Password:</label>
        <input
          className="input-field"
          id="password"
          name="password"
          data-testid="password-input"
          type="password"
          value={formData.password}
          onChange={handleChange}
        />
        <label htmlFor="password-confirm">Password Confirm:</label>
        <input
          className="input-field"
          id="passwordCheck"
          name="passwordCheck"
          data-testid="passwordCheck"
          type="password"
          value={formData.passwordCheck}
          onChange={handleChange}
        />
      </div>
      <button onClick={sendSignUp}>Sign Up</button>
      {error && <p className="characters">A network error was encountered</p>}
      {response &&
        response.errors &&
        response.errors.map((error) => {
          return <p className="characters">{error.message}</p>;
        })}
    </div>
  );
}

export default SignUp;
