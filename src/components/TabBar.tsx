import { NavLink, useNavigate } from 'react-router-dom';
import { usePendingFriendActivityCount, useIncomingRequests } from '../data/hooks';
import './TabBar.css';

const base = import.meta.env.BASE_URL;

const tabs = [
  { to: '/', icon: '🎮', art: `${base}ui-icons/profile.png`, label: 'Profile', end: true },
  { to: '/friends', icon: '👾', art: `${base}ui-icons/friends.png`, label: 'Friends' },
  { to: '/cafes', icon: '🏠', art: `${base}ui-icons/cafes.png`, label: 'Cafes' },
  { to: '/sales', icon: '🏷️', art: `${base}ui-icons/sales.png`, label: 'Sales' },
];

export function TabBar() {
  const navigate = useNavigate();
  const incoming = useIncomingRequests();
  const pendingActivity = usePendingFriendActivityCount();
  const badge = pendingActivity + (incoming?.length ?? 0);

  return (
    <nav className="tabbar">
      {tabs.slice(0, 2).map((t) => (
        <Tab key={t.to} {...t} badge={t.to === '/friends' ? badge : 0} />
      ))}

      <button className="tabbar__upload" onClick={() => navigate('/upload')} aria-label="Upload cheki">
        <span className="tabbar__upload-plus">+</span>
        <span className="tabbar__upload-label">UPLOAD</span>
      </button>

      {tabs.slice(2).map((t) => (
        <Tab key={t.to} {...t} badge={0} />
      ))}
    </nav>
  );
}

function Tab({
  to,
  icon,
  art,
  label,
  end,
  badge,
}: {
  to: string;
  icon: string;
  art?: string;
  label: string;
  end?: boolean;
  badge: number;
}) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `tabbar__tab${isActive ? ' is-active' : ''}`}>
      <span className="tabbar__icon">
        {art ? <img src={art} alt="" className="tabbar__icon-art" /> : icon}
        {badge > 0 && <span className="tabbar__badge">{badge}</span>}
      </span>
      <span className="tabbar__label">{label}</span>
    </NavLink>
  );
}
