// src/App.jsx
import './App.css';
import { Outlet, Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="p-4">
      <header className="mb-4">
        <nav className="space-x-4">
          <Link to="/">Signup</Link>
          <Link to="/login">Login</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <Outlet /> {/* This renders the matched child route */}
    </div>
  );
}
