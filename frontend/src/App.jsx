import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CanvasserDashboard from './pages/CanvasserDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CEODashboard from './pages/CEODashboard';
import CFODashboard from './pages/CFODashboard';
import CCODashboard from './pages/CCODashboard';
import { getHomeRoute, isCanvasser } from './lib/rbac';

// Auth Context
export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = React.useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <div className="min-h-screen bg-murugan-dark text-white font-sans selection:bg-murugan-accent selection:text-black">
          <Routes>
            {/* Root — redirect based on role */}
            <Route
              path="/"
              element={
                !user ? (
                  <Login />
                ) : (
                  <Navigate to={getHomeRoute(user)} replace />
                )
              }
            />

            {/* Canvasser */}
            <Route
              path="/canvasser"
              element={user ? <CanvasserDashboard /> : <Navigate to="/" replace />}
            />

            {/* Admin Executive (Operational) */}
            <Route
              path="/manager"
              element={user ? <ManagerDashboard /> : <Navigate to="/" replace />}
            />

            {/* CEO */}
            <Route
              path="/ceo"
              element={user ? <CEODashboard /> : <Navigate to="/" replace />}
            />

            {/* CFO */}
            <Route
              path="/cfo"
              element={user ? <CFODashboard /> : <Navigate to="/" replace />}
            />

            {/* CCO */}
            <Route
              path="/cco"
              element={user ? <CCODashboard /> : <Navigate to="/" replace />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
