import { useNavigate } from 'react-router-dom';

export function BackHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <button className="btn ghost" style={{ padding: '8px 10px' }} onClick={() => navigate(-1)}>
        {'<'}
      </button>
      <h2 className="screen-title" style={{ margin: 0 }}>{title}</h2>
    </div>
  );
}
