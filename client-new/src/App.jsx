import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PropertyForm from "./pages/PropertyForm";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import EditProfile from "./pages/EditProfile";
import TravelForm from "./pages/TravelForm";
import BusinessForm from "./pages/BusinessForm";
import AdminPayment from './pages/AdminPayment';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Auth Error:", error.message);
      setUser(data?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <Layout user={user} onHome={true}>
              <Home user={user} />
            </Layout>
          } 
        />
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected routes with layout */}
        {user && (
          <>
            <Route
              path="/dashboard"
              element={
                <Layout user={user}>
                  <Dashboard user={user} />
                </Layout>
              }
            />
            <Route
              path="/property-form"
              element={
                <Layout user={user}>
                  <PropertyForm user={user} />
                </Layout>
              }
            />
            <Route
              path="/travel-form"
              element={
                <Layout user={user}>
                  <TravelForm user={user} />
                </Layout>
              }
            />
            <Route
              path="/business-form"
              element={
                <Layout user={user}>
                  <BusinessForm user={user} />
                </Layout>
              }
            />
            <Route 
              path="/admin/payment" 
              element={<AdminPayment user={user} />} 
            />
            <Route
              path="/edit-profile"
              element={<EditProfile user={user} />}
            />
          </>
        )}

        {/* Redirect authenticated users from auth page */}
        {user && (
          <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
        )}

        {/* Redirect unauthenticated users */}
        {!user && (
          <>
            <Route path="/dashboard" element={<Navigate to="/auth" replace />} />
            <Route path="/*" element={<Navigate to="/auth" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
