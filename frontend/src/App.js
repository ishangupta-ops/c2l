import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import DashboardPage from "@/pages/DashboardPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import TimelinePage from "@/pages/TimelinePage";
import ManufacturersPage from "@/pages/ManufacturersPage";
import SummaryDashboardPage from "@/pages/SummaryDashboardPage";
import LoginPage from "@/pages/LoginPage";
import { fetchProjects, fetchManufacturers, seedData } from "@/lib/api";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (user === false) return <Navigate to="/login" replace />;
  return children;
}

function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (user && user !== false) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function AppContent() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [p, m] = await Promise.all([fetchProjects(), fetchManufacturers()]);
      setProjects(p); setManufacturers(m);
      if (p.length === 0 && m.length === 0) {
        await seedData();
        const [p2, m2] = await Promise.all([fetchProjects(), fetchManufacturers()]);
        setProjects(p2); setManufacturers(m2);
      }
    } catch (err) { console.error('Failed to load data:', err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const refreshProjects = async () => { setProjects(await fetchProjects()); };
  const refreshManufacturers = async () => { setManufacturers(await fetchManufacturers()); };

  return (
    <div className="flex min-h-screen bg-slate-50" data-testid="app-root">
      <Sidebar projects={projects} navigate={navigate} />
      <main className="flex-1 ml-56 min-h-screen main-scroll overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
        ) : (
          <Routes>
            <Route path="/" element={<DashboardPage projects={projects} refreshProjects={refreshProjects} navigate={navigate} />} />
            <Route path="/summary" element={<SummaryDashboardPage projects={projects} navigate={navigate} />} />
            <Route path="/project/:id" element={<ProjectDetailWrapper projects={projects} refreshProjects={refreshProjects} navigate={navigate} />} />
            <Route path="/timeline" element={<TimelinePage projects={projects} navigate={navigate} />} />
            <Route path="/manufacturers" element={<ManufacturersPage manufacturers={manufacturers} refreshManufacturers={refreshManufacturers} />} />
          </Routes>
        )}
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}

function ProjectDetailWrapper({ projects, refreshProjects, navigate }) {
  const { id } = useParams();
  const project = projects.find(p => p.id === id);
  if (!project) return <div className="flex items-center justify-center min-h-screen text-slate-400">Project not found</div>;
  return <ProjectDetailPage project={project} refreshProjects={refreshProjects} navigate={navigate} />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />
        </Routes>
        <Toaster position="bottom-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
