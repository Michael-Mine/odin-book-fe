import App from "../App.jsx";
import RouteErrorPage from "../pages/RouteErrorPage.jsx";
import NotFound from "../pages/NotFound.jsx";
import Login from "../features/auth/Login.jsx";
import ProtectedLayout from "../layouts/ProtectedLayout.jsx";
import Feed from "../features/feed/Feed.jsx";
import NewPost from "../features/posts/NewPost.jsx";
import ViewPost from "../features/posts/ViewPost.jsx";

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
          { index: true, element: <Feed /> },
          { path: "new-post", element: <NewPost /> },
          { path: "post/:postCuid", element: <ViewPost /> },
          // { path: "profile/:userCuid", element: <Profile/> },
          // { path: "following", element: <Following/> },
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
