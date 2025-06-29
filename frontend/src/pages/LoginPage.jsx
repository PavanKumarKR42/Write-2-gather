// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Use environment variable for the backend URL
// REACT_APP_BACKEND_URL will be set by your frontend hosting platform (e.g., Render) in production
// In local development, ensure it's defined in your frontend's .env file
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; // <--- CHANGED

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // Use environment variable for backend URL
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, { // <--- CHANGED
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("authToken", data.token);
      navigate("/dashboard", { replace: true }); // ✅ Optionally prevent back navigation to login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Login</h1>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <input
        className="border p-2 w-full mb-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <input
        className="border p-2 w-full mb-4"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 w-full"
        onClick={handleLogin}
        disabled={loading || !email || !password}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}