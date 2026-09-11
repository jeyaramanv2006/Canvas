import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CanvasserDashboard from './pages/CanvasserDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CEODashboard from './pages/CEODashboard';
import CFODashboard from './pages/CFODashboard';
import CCODashboard from './pages/CCODashboard';
import ForcePasswordResetModal from './components/ForcePasswordResetModal';
import { getHomeRoute } from './lib/rbac';
import { getToken, setToken } from './api/client';
import { mockApi } from './mockApi';

export const AuthContext = React.createContext(null);

function App() {
  const [user, setUserState] = React.useState(() => {
    try {
      const cached = localStorage.getItem('mg_current_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [initializing, setInitializing] = React.useState(true);

  const setUser = React.useCallback((newUser) => {
    if (newUser) {
      localStorage.setItem('mg_current_user', JSON.stringify(newUser));
      setUserState(newUser);
    } else {
      localStorage.removeItem('mg_current_user');
      setToken('');
      setUserState(null);
    }
  }, []);

  React.useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (token) {
        try {
          const currentUser = await mockApi.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            setUser(null);
          }
        } catch {
          // Token expired or invalid
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setInitializing(false);
    }
    restoreSession();
  }, [setUser]);

  if (initializing && getToken()) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <div className="min-h-screen bg-murugan-dark text-white font-sans selection:bg-murugan-accent selection:text-black">
          <ForcePasswordResetModal />
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

            {/* Canvasser Dashboard */}
            <Route
              path="/canvasser"
              element={user ? <CanvasserDashboard /> : <Navigate to="/" replace />}
            />

            {/* Admin Operations Executive */}
            <Route
              path="/manager"
              element={user ? <ManagerDashboard /> : <Navigate to="/" replace />}
            />

            {/* Chief Executive Officer (CEO) */}
            <Route
              path="/ceo"
              element={user ? <CEODashboard /> : <Navigate to="/" replace />}
            />

            {/* Chief Financial Officer (CFO) */}
            <Route
              path="/cfo"
              element={user ? <CFODashboard /> : <Navigate to="/" replace />}
            />

            {/* Chief Commercial Officer (CCO) */}
            <Route
              path="/cco"
              element={user ? <CCODashboard /> : <Navigate to="/" replace />}
            />

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
