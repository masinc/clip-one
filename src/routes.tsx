import { createBrowserRouter } from "react-router";
import App from "./App";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import ActionsSettings from "./pages/ActionsSettings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "actions-settings",
        element: <ActionsSettings />,
      },
    ],
  },
]);