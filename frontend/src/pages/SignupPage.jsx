// src/pages/SignupPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Use environment variable for the backend URL
// REACT_APP_BACKEND_URL will be set by your frontend hosting platform (e.g., Render) in production
// In local development, ensure it's defined in your frontend's .env file
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; // <--- CHANGED

export default function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestOTP = async () => {
    setLoading(true);
    setError("");
    try {
      // Use environment variable for backend URL
      const res = await fetch(`${BACKEND_URL}/api/auth/request-otp`, { // <--- CHANGED
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!email || !otp) {
      setError("Email and OTP are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Use environment variable for backend URL
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, { // <--- CHANGED
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) throw new Error(data.error || "OTP verification failed");
      setVerified(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async () => {
    if (!name || !email || !password) {
      setError("All fields are required for registration.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Use environment variable for backend URL
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, { // <--- CHANGED
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setRegistered(true);

      // Redirect after short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!verified) {
      setError("Please verify OTP before registering.");
      return;
    }
    await registerUser();
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Signup with Gmail OTP</h1>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <input
        className="border p-2 w-full mb-2"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={registered}
      />

      <input
        className="border p-2 w-full mb-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={otpSent || registered}
      />

      <input
        className="border p-2 w-full mb-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={registered}
      />

      {!otpSent ? (
        <button
          className="bg-blue-500 text-white px-4 py-2 w-full"
          onClick={requestOTP}
          disabled={loading || !email}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      ) : (
        <>
          <input
            className="border p-2 w-full mt-2 mb-2"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={verified}
          />

          {!verified ? (
            <button
              className="bg-green-500 text-white px-4 py-2 w-full"
              onClick={verifyOTP}
              disabled={loading || !otp}
            >
              {loading ? "Verifying OTP..." : "Verify OTP"}
            </button>
          ) : (
            <button
              className="bg-purple-600 text-white px-4 py-2 w-full"
              onClick={handleFinalSubmit}
              disabled={loading || registered}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          )}

          {verified && !registered && (
            <p className="text-green-600 mt-2">✅ OTP Verified</p>
          )}
          {registered && (
            <p className="text-green-700 mt-2 font-semibold">
              🎉 User Registered Successfully! Redirecting to login...
            </p>
          )}
        </>
      )}
    </div>
  );
}