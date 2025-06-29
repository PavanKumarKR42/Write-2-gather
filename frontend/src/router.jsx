// src/router.jsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Whiteboard from "./pages/Whiteboard"; // <--- NEW: Import the Whiteboard component

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // acts as layout
    children: [
      { path: "", element: <SignupPage /> },         // `/` (default child route)
      { path: "login", element: <LoginPage /> },     // `/login`
      { path: "dashboard", element: <Dashboard /> }, // `/dashboard`
      // <--- NEW: Add the route for your Whiteboard component
      // The ':roomId' is a URL parameter that will capture the specific room ID
      { path: "board/:roomId", element: <Whiteboard /> }
    ]
  }
]);

export default router;