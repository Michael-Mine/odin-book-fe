import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router";
import SignUp from "./SignUp";

function Login() {
  const { setUser } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [inputEmail, setInputEmail] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [signUpForm, setSignUpForm] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const url = `${apiUrl}v1/auth/login`;
  const destination = location.state?.from?.pathname ?? "/";

  const openSignUpForm = () => {
    setSignUpForm(!signUpForm);
  };

  const sendLogin = () => {
    console.log("logging in");
    setLoggingIn(true);
    setError(null);

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        username: inputEmail,
        password: inputPass,
      }),
    })
      .then((httpResponse) => {
        return httpResponse.json().then((data) => {
          return { httpResponse, data };
        });
      })
      .then(({ httpResponse, data }) => {
        setResponse(data);

        if (httpResponse.ok && data.user) {
          setUser(data.user);
          navigate(destination, { replace: true });
        }
      })
      .catch((error) => setError(error))
      .finally(() => setLoggingIn(false));
  };

  if (loggingIn) return <p>Logging In...</p>;

  if (response && response.user) {
    setUser(response.user);
  }

  return (
    <div>
      <h1>Mr Mine Odin-Book</h1>
      <h2>Login to access</h2>

      <div className="input-container">
        <label htmlFor="username">Email:</label>
        <input
          className="input-field"
          id="username"
          data-testid="username-input"
          type="text"
          value={inputEmail}
          onChange={(event) => setInputEmail(event.target.value)}
        />

        <label htmlFor="password">Password:</label>
        <input
          className="input-field"
          id="password"
          data-testid="password-input"
          type="password"
          value={inputPass}
          onChange={(event) => setInputPass(event.target.value)}
        />
      </div>

      <button onClick={sendLogin}>Login</button>
      <button onClick={openSignUpForm}>or Sign Up</button>

      {error && <p className="characters">A network error was encountered</p>}
      {response && !response.user && (
        <p className="characters">Authentication failed</p>
      )}
      {signUpForm && <SignUp />}
    </div>
  );
}

export default Login;
