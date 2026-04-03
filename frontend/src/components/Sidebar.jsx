import { useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Palette, Factory, Plus } from 'lucide-react';
import { STATUS_COLORS } from '@/lib/constants';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Timeline Analysis', path: '/timeline', icon: BarChart3 },
  { label: 'Color Bank', path: '/colors', icon: Palette },
  { label: 'Manufacturers', path: '/manufacturers', icon: Factory },
];

export function Sidebar({ projects, navigate }) {
  const location = useLocation();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col z-20" data-testid="sidebar">
      <div className="px-4 py-5 border-b border-neutral-800">
        <div className="text-xs font-bold tracking-[0.2em] uppercase text-white font-display" data-testid="sidebar-logo">Launch Control</div>
        <div className="text-[10px] text-neutral-500 mt-0.5 tracking-wider uppercase">NPD Tracker</div>
      </div>

      <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 pt-3">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 px-2 mb-2">Views</div>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] mb-0.5 transition-all duration-150 ${
                active ? 'bg-white/10 text-white font-medium' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
              }`}
            >
              <item.icon className="w-4 h-4" strokeWidth={1.5} />
              {item.label}
            </button>
          );
        })}

        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 px-2 mt-4 mb-2">Projects</div>
        <div className="space-y-0.5">
          {projects.slice(0, 15).map(p => {
            const sc = STATUS_COLORS[p.status] || STATUS_COLORS['on-track'];
            const active = location.pathname === `/project/${p.id}`;
            return (
              <button
                key={p.id}
                data-testid={`sidebar-project-${p.id}`}
                onClick={() => navigate(`/project/${p.id}`)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-all duration-150 text-left ${
                  active ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                <span className="truncate flex-1">{p.name}</span>
              </button>
            );
          })}
          {projects.length === 0 && (
            <div className="px-2.5 py-1.5 text-[11px] text-neutral-600">No projects</div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-neutral-800">
        <button
          data-testid="sidebar-new-project-btn"
          onClick={() => navigate('/?new=true')}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-white text-black text-[13px] font-medium hover:bg-neutral-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          New Project
        </button>
      </div>
    </aside>
  );
}
