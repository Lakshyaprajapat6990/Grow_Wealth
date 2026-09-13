import { useEffect, useState } from 'react';
import api from '../api';
import './TeamHierarchy.css';

function TreeNode({ node, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen || node.depth < 1);
  const hasKids = (node.children || []).length > 0;

  return (
    <li className="th-node">
      <div className="th-row">
        {hasKids ? (
          <button type="button" className="th-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle">
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="th-toggle th-leaf">•</span>
        )}
        <div className="th-main">
          <strong>{node.name}</strong>
          <span className="th-id">{node.userId}</span>
          <span className={`th-badge ${node.isJoined ? 'yes' : 'no'}`}>{node.isJoined ? 'Joined' : 'Not Joined'}</span>
        </div>
        <div className="th-meta">
          <span>Direct: {node.directCount}</span>
          <span>Team: {node.teamCount}</span>
          <span>Fund: ${Number(node.fundBalance || 0).toFixed(2)}</span>
          <span>Dep: ${Number(node.totalDeposited || 0).toFixed(2)}</span>
        </div>
      </div>
      {hasKids && open && (
        <ul className="th-children">
          {node.children.map((child) => (
            <TreeNode key={child.userId} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TeamHierarchy({ focusUserId = '' }) {
  const [query, setQuery] = useState('');
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [rootLabel, setRootLabel] = useState('All top-level teams');

  async function load(userId = '') {
    setLoading(true);
    setErr('');
    try {
      const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const { data } = await api.get(`/admin/team-hierarchy${q}`);
      setTree(data.tree || []);
      setRootLabel(userId ? `Team under ${userId}` : 'All top-level teams');
      if (userId) setQuery(userId);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to load hierarchy');
      setTree([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  useEffect(() => {
    if (focusUserId) {
      load(String(focusUserId).toUpperCase()).catch(() => {});
    }
  }, [focusUserId]);

  function search(e) {
    e.preventDefault();
    const id = query.trim().toUpperCase();
    load(id || '');
  }

  return (
    <div className="card th-wrap">
      <h3 style={{ marginTop: 0 }}>Team Hierarchy</h3>
      <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
        Search any User ID (e.g. Pradeep&apos;s ID) to see who is under them — sponsor → directs → their team.
      </p>

      <form className="th-search" onSubmit={search}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="User ID (leave blank for all roots)"
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Loading…' : 'Show Tree'}
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            setQuery('');
            load();
          }}
        >
          Reset
        </button>
      </form>

      {err && <div className="alert alert-error">{err}</div>}
      <p className="th-root-label">{rootLabel}</p>

      {tree.length === 0 && !loading ? (
        <p style={{ color: 'var(--text-muted)' }}>No members found.</p>
      ) : (
        <ul className="th-tree">
          {tree.map((node) => (
            <TreeNode key={node.userId} node={node} defaultOpen />
          ))}
        </ul>
      )}
    </div>
  );
}
