import { BarChart3, Database, FileSpreadsheet, Moon, PanelLeftClose, PanelLeftOpen, PlusCircle, Sun, Utensils, type LucideIcon } from 'lucide-react';
import { ReactNode, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { setBigScreen, toggleTheme } from '../store/appSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { ProjectSelect } from './ProjectSelect';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { UnsavedChangesGuard, useUnsavedGuard } from '../hooks/useUnsavedGuard';

const navItems = [
  { path: '/dashboard', label: '看板', icon: BarChart3 },
  { path: '/projects', label: '项目', icon: Utensils },
  { path: '/entry', label: '录入', icon: PlusCircle },
  { path: '/data', label: '数据', icon: FileSpreadsheet }
];

const NavButton = ({ path, label, icon: Icon }: { path: string; label: string; icon: LucideIcon }) => {
  const location = useLocation();
  const { guardedNavigate } = useUnsavedGuard();
  const active = location.pathname.startsWith(path);

  return (
    <button type="button" className={`nav-item ${active ? 'is-active' : ''}`} onClick={() => guardedNavigate(path)}>
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
};

const ShellAction = ({ children }: { children: ReactNode }) => <div className="shell-action">{children}</div>;

const NavList = () => (
  <>
    {navItems.map((item) => (
      <NavButton key={item.path} path={item.path} label={item.label} icon={item.icon} />
    ))}
  </>
);

export const Layout = () => {
  const dispatch = useAppDispatch();
  const { darkMode, bigScreen, syncNotice } = useAppSelector((state) => state.app);
  const mainRef = useRef<HTMLElement>(null);

  useSwipeNavigation(mainRef);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  useEffect(() => {
    const onFullscreenChange = () => {
      dispatch(setBigScreen(Boolean(document.fullscreenElement)));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [dispatch]);

  const toggleBigScreenMode = async () => {
    if (!document.fullscreenElement) {
      dispatch(setBigScreen(true));
      await document.documentElement.requestFullscreen?.().catch(() => undefined);
      return;
    }
    await document.exitFullscreen?.().catch(() => undefined);
    dispatch(setBigScreen(false));
  };

  return (
    <div className={`app-shell ${bigScreen ? 'app-shell--big' : ''}`}>
      <UnsavedChangesGuard />
      {!bigScreen ? (
        <aside className="sidebar">
          <div className="brand">
            <Database size={26} />
            <div>
              <strong>团餐营收</strong>
              <span>Revenue Ops</span>
            </div>
          </div>
          <nav className="side-nav">
            <NavList />
          </nav>
        </aside>
      ) : null}

      <div className="workspace">
        <header className="topbar">
          <ProjectSelect />
          {syncNotice ? <span className="sync-pill">{syncNotice}</span> : null}
          <ShellAction>
            <button className="icon-button" type="button" title="切换暗色主题" onClick={() => dispatch(toggleTheme())}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button" type="button" title="切换数据大屏" onClick={toggleBigScreenMode}>
              {bigScreen ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </ShellAction>
        </header>
        <main ref={mainRef} className="content">
          <Outlet />
        </main>
      </div>

      {!bigScreen ? (
        <nav className="bottom-nav">
          <NavList />
        </nav>
      ) : null}
    </div>
  );
};
