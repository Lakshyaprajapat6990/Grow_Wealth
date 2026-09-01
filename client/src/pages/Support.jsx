import { useEffect, useState } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    const { data } = await api.get('/support/me');
    setTickets(data.supports || []);
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.post('/support/create', { subject, message });
      setMsg('Ticket submitted successfully');
      setSubject('');
      setMessage('');
      await load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed');
    }
  }

  return (
    <div>
      <PageHeader title="Support Ticket" subtitle="Raise a ticket and get admin reply" />
      <form className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }} onSubmit={submit}>
        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <div className="field">
          <label className="label">Subject</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">Message</label>
          <textarea className="input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required style={{ resize: 'vertical' }} />
        </div>
        <button className="btn btn-primary">Submit Ticket</button>
      </form>
      {tickets.map((t) => (
        <div key={t._id} className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <strong>{t.subject}</strong>
            <span style={{ color: '#8ba3c7', fontSize: '0.82rem' }}>{t.status}</span>
          </div>
          <p style={{ color: '#8ba3c7', margin: '0 0 0.5rem' }}>{t.message}</p>
          {t.adminReply && (
            <div style={{ background: 'rgba(37,99,235,0.1)', padding: '0.75rem', borderRadius: 8, border: '1px solid #1e3a5f' }}>
              <strong style={{ color: '#93c5fd' }}>Admin Reply:</strong>
              <p style={{ margin: '0.25rem 0 0', color: '#c8d9f0' }}>{t.adminReply}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
