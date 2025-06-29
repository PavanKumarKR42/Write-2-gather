// src/router.jsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // acts as layout
    children: [
      { path: "", element: <SignupPage /> },       // `/`
      { path: "login", element: <LoginPage /> },   // `/login`
      { path: "dashboard", element: <Dashboard /> } // `/dashboard`
    ]
  }
]);

export default router;
