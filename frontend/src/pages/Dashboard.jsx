// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// Use environment variable for the backend URL
// REACT_APP_BACKEND_URL will be set by your frontend hosting platform (e.g., Render) in production
// In local development, ensure it's defined in your frontend's .env file
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; // <--- CHANGED

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("authToken");

  // Get the current user's ID from the token for comparison
  let currentUserId = null;
  if (token) {
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      currentUserId = decodedToken.userId;
    } catch (e) {
      console.error("Error decoding token:", e);
      localStorage.removeItem("authToken"); // Clear invalid token
      navigate("/login", { replace: true });
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    } else {
      fetchRooms();
    }
  }, [token, navigate]);

  const fetchRooms = async () => {
    setLoading(true); // Set loading true before fetching
    setError(""); // Clear previous errors
    try {
      // Use environment variable for backend URL
      const res = await fetch(`${BACKEND_URL}/api/rooms/my-rooms`, { // <--- CHANGED
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login", { replace: true });
          return;
        }
        throw new Error(data.error || "Failed to fetch rooms");
      }
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setError("Room name cannot be empty.");
      return;
    }
    setError(""); // Clear previous errors

    try {
      // Use environment variable for backend URL
      const res = await fetch(`${BACKEND_URL}/api/rooms/create`, { // <--- CHANGED
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoomName }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login", { replace: true });
          return;
        }
        throw new Error(data.error || "Failed to create room");
      }
      setNewRoomName("");
      fetchRooms(); // Re-fetch rooms to update the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      setError("Room ID cannot be empty.");
      return;
    }
    setError(""); // Clear previous errors

    try {
      // Use environment variable for backend URL
      const res = await fetch(`${BACKEND_URL}/api/rooms/join`, { // <--- CHANGED
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId: joinRoomId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login", { replace: true });
          return;
        }
        throw new Error(data.error || "Failed to join room");
      }
      setJoinRoomId("");
      fetchRooms(); // Re-fetch rooms to update the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetPermissions = async (roomId, targetUserId, canWrite) => {
    setError(""); // Clear previous errors
    try {
      // Use environment variable for backend URL
      const res = await fetch(`${BACKEND_URL}/api/rooms/permissions`, { // <--- CHANGED
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId, targetUserId, canWrite }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login", { replace: true });
          return;
        }
        throw new Error(data.error || "Failed to update permissions");
      }
      fetchRooms(); // Re-fetch rooms to show updated permissions
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📋 Your Rooms</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">Create New Room</h2>
        <input
          type="text"
          placeholder="New Room Name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          className="border p-2 w-full mb-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleCreateRoom}
          className="bg-blue-600 text-white px-4 py-2 w-full rounded-md hover:bg-blue-700 transition-colors"
        >
          ➕ Create Room
        </button>
      </div>

      <div className="mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">Join Existing Room</h2>
        <input
          type="text"
          placeholder="Enter Room ID to Join"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          className="border p-2 w-full mb-2 rounded-md focus:ring-green-500 focus:border-green-500"
        />
        <button
          onClick={handleJoinRoom}
          className="bg-green-600 text-white px-4 py-2 w-full rounded-md hover:bg-green-700 transition-colors"
        >
          🔗 Join Room
        </button>
      </div>

      {loading ? (
        <p className="text-center py-4">Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <p className="text-center py-4 text-gray-600">No rooms joined or created yet. Create one or join an existing one!</p>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-3">My Rooms</h2>
          {rooms.map((room) => (
            <div key={room._id} className="border p-4 rounded-lg shadow-md bg-white">
              <h3 className="font-semibold text-xl mb-2">{room.name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                Created by:{" "}
                <span className="font-medium">
                  {room.creator?.name || "Unknown"}
                </span>
                {room.creator?._id === currentUserId && " (You)"}
              </p>
              <p className="text-sm mb-3">
                Your Write Access:{" "}
                <span className="font-medium">
                  {room.participants.find(
                    (p) => p.user?._id === currentUserId
                  )?.canWrite
                    ? "✅ Yes"
                    : "❌ No"}
                </span>
              </p>

              <h4 className="font-medium text-md mb-2">Participants:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                {room.participants.map((participant) => (
                  <li key={participant.user?._id || participant._id} className="text-sm"> {/* Added participant._id as fallback key */}
                    {participant.user?.name || "Unknown User"} ({participant.user?.email || ""})
                    <span className="ml-2">
                      {participant.canWrite ? "(Can Write)" : "(Read Only)"}
                    </span>
                    {room.creator?._id === currentUserId &&
                     participant.user?._id !== currentUserId && ( // Can't change own permissions this way
                      <span className="ml-3">
                        <button
                          onClick={() => handleSetPermissions(room._id, participant.user?._id, !participant.canWrite)}
                          className={`ml-2 px-3 py-1 rounded text-white text-xs ${
                            participant.canWrite
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-purple-500 hover:bg-purple-600"
                          } transition-colors`}
                        >
                          {participant.canWrite ? "Revoke Write" : "Grant Write"}
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {/* Link to Whiteboard */}
              <Link
                to={`/board/${room._id}`}
                className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Open Whiteboard 🎨
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}