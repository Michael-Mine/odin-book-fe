import App from "../App.jsx";
import ErrorPage from "../pages/Error-404.jsx";

const routes = [
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      // { index: true, element: <Home /> },
      // { path: "profile/:userCuid", element: <Profile/> },
      // { path: "following", element: <Following/> },
      // { path: "new-post", element: <NewPost /> },
      // { path: "post/:postCuid", element: <Game /> },
    ],
  },
];

export default routes;
