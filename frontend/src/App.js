import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import DashboardPage from "@/pages/DashboardPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import TimelinePage from "@/pages/TimelinePage";
import ColorBankPage from "@/pages/ColorBankPage";
import ManufacturersPage from "@/pages/ManufacturersPage";
import LoginPage from "@/pages/LoginPage";
import { fetchProjects, fetchColors, fetchManufacturers, seedData } from "@/lib/api";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
  if (user === false) return <Navigate to="/login" replace />;
  return children;
}

function AppContent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [colors, setColors] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [p, c, m] = await Promise.all([fetchProjects(), fetchColors(), fetchManufacturers()]);
      setProjects(p);
      setColors(c);
      setManufacturers(m);
      if (p.length === 0 && c.length === 0 && m.length === 0) {
        await seedData();
        const [p2, c2, m2] = await Promise.all([fetchProjects(), fetchColors(), fetchManufacturers()]);
        setProjects(p2);
        setColors(c2);
        setManufacturers(m2);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const refreshProjects = async () => { const p = await fetchProjects(); setProjects(p); };
  const refreshColors = async () => { const c = await fetchColors(); setColors(c); };
  const refreshManufacturers = async () => { const m = await fetchManufacturers(); setManufacturers(m); };

  return (
    <div className="flex min-h-screen bg-neutral-950" data-testid="app-root">
      <Sidebar projects={projects} navigate={navigate} />
      <main className="flex-1 ml-56 min-h-screen main-scroll overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen" data-testid="loading-spinner">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<DashboardPage projects={projects} refreshProjects={refreshProjects} navigate={navigate} />} />
            <Route path="/project/:id" element={<ProjectDetailWrapper projects={projects} refreshProjects={refreshProjects} colors={colors} navigate={navigate} />} />
            <Route path="/timeline" element={<TimelinePage projects={projects} navigate={navigate} />} />
            <Route path="/colors" element={<ColorBankPage colors={colors} refreshColors={refreshColors} />} />
            <Route path="/manufacturers" element={<ManufacturersPage manufacturers={manufacturers} refreshManufacturers={refreshManufacturers} />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function ProjectDetailWrapper({ projects, refreshProjects, colors, navigate }) {
  const { id } = useParams();
  const project = projects.find(p => p.id === id);
  if (!project) return <div className="flex items-center justify-center min-h-screen text-neutral-500">Project not found</div>;
  return <ProjectDetailPage project={project} refreshProjects={refreshProjects} colors={colors} navigate={navigate} />;
}

function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
  if (user && user !== false) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="bottom-right" theme="dark" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
