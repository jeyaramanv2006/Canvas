import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CanvasserDashboard from './pages/CanvasserDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import { isAdmin, isCanvasser } from './lib/rbac';

// Auth Context
export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = React.useState(null);

  const isFieldUser = user ? isCanvasser(user) : false;
  const isManagementUser = user ? isAdmin(user) : false;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <div className="min-h-screen bg-murugan-dark text-white font-sans selection:bg-murugan-accent selection:text-black">
          <Routes>
            <Route 
              path="/" 
              element={
                !user ? (
                  <Login />
                ) : isFieldUser ? (
                  <Navigate to="/canvasser" />
                ) : (
                  <Navigate to="/manager" />
                )
              } 
            />
            <Route 
              path="/canvasser" 
              element={
                user ? (
                  <CanvasserDashboard />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            <Route 
              path="/manager" 
              element={
                user ? (
                  <ManagerDashboard />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
