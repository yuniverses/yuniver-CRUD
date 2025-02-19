import React, { useEffect, useState } from 'react';
import { getInbox, sendMail } from '../api/mail';

function MailPage() {
  const [inbox, setInbox] = useState([]);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    try {
      const data = await getInbox(token);
      setInbox(data);
    } catch (err) {
      console.error('Get Inbox Failed', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await sendMail(to, subject, body, token);
      alert('寄信成功');
      setTo('');
      setSubject('');
      setBody('');
    } catch (err) {
      console.error('Send Mail Failed', err);
      alert('寄信失敗');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Mail - 收件匣</h2>
      <ul>
        {inbox.map((mail) => (
          <li key={mail._id}>
            <strong>From:</strong> {mail.from} | <strong>Subject:</strong> {mail.subject}
          </li>
        ))}
      </ul>

      <hr />

      <h3>寄信</h3>
      <form onSubmit={handleSend}>
        <div>
          <label>To: </label>
          <input value={to} onChange={(e) => setTo(e.target.value)} required />
        </div>
        <div>
          <label>Subject: </label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div>
          <label>Body: </label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
        </div>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default MailPage;
