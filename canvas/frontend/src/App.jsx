import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CanvasserDashboard from './pages/CanvasserDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

// Mock Auth Context
export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = React.useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <div className="min-h-screen bg-murugan-dark text-white font-sans selection:bg-murugan-accent selection:text-black">
          <Routes>
            <Route path="/" element={!user ? <Login /> : (user.role === 'manager' ? <Navigate to="/manager" /> : <Navigate to="/canvasser" />)} />
            <Route path="/canvasser" element={user?.role === 'canvasser' ? <CanvasserDashboard /> : <Navigate to="/" />} />
            <Route path="/manager" element={user?.role === 'manager' ? <ManagerDashboard /> : <Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
