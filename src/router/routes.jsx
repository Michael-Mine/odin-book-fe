import App from "../App.jsx";
import RouteErrorPage from "../pages/RouteErrorPage.jsx";
import NotFound from "../pages/NotFound.jsx";
import Login from "../features/auth/Login.jsx";
import ProtectedLayout from "../layouts/ProtectedLayout.jsx";
import Home from "../pages/Home.jsx";
import NewPost from "../features/posts/NewPost.jsx";

const routes = [
  {
    path: "/",
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        element: <ProtectedLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "new-post", element: <NewPost /> },
          // { path: "profile/:userCuid", element: <Profile/> },
          // { path: "following", element: <Following/> },
          // { path: "post/:postCuid", element: <Post /> },
        ],
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

export default routes;
