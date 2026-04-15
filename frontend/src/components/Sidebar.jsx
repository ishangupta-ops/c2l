import { useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Factory, Plus, LogOut, PieChart } from 'lucide-react';
import { STATUS_COLORS } from '@/lib/constants';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Summary', path: '/summary', icon: PieChart },
  { label: 'Timeline Analysis', path: '/timeline', icon: BarChart3 },
  { label: 'Manufacturers', path: '/manufacturers', icon: Factory },
];

export function Sidebar({ projects, navigate }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-56 bg-slate-900 flex flex-col z-20" data-testid="sidebar">
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="text-xs font-bold tracking-[0.2em] uppercase text-white font-display" data-testid="sidebar-logo">Launch Control</div>
        <div className="text-[10px] text-slate-400 mt-0.5 tracking-wider uppercase">NPD Tracker</div>
      </div>

      <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 pt-3">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 px-2 mb-2">Views</div>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button key={item.path} data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] mb-0.5 transition-all duration-150 ${active ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-4 h-4" strokeWidth={1.5} />
              {item.label}
            </button>
          );
        })}

        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 px-2 mt-4 mb-2">Projects</div>
        <div className="space-y-0.5">
          {projects.slice(0, 15).map(p => {
            const sc = STATUS_COLORS[p.status] || STATUS_COLORS['on-track'];
            const active = location.pathname === `/project/${p.id}`;
            return (
              <button key={p.id} data-testid={`sidebar-project-${p.id}`} onClick={() => navigate(`/project/${p.id}`)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-all duration-150 text-left ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                <span className="truncate flex-1">{p.name}</span>
              </button>
            );
          })}
          {projects.length === 0 && <div className="px-2.5 py-1.5 text-[11px] text-slate-600">No projects</div>}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-2">
        <button data-testid="sidebar-new-project-btn" onClick={() => navigate('/?new=true')}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} /> New Project
        </button>
        {user && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-slate-400 truncate">{user.name || user.email}</span>
            <button data-testid="logout-btn" onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors p-1" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
