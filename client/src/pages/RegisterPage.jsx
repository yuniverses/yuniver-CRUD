import React, { useState } from 'react';
import { registerUser } from '../api/auth';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerUser(username, password);
      alert('註冊成功，請登入');
      window.location.href = '/login';
    } catch (err) {
      alert('註冊失敗：' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>註冊</h1>
      <form onSubmit={handleRegister}>
        <div>
          <label>帳號：</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>密碼：</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">註冊</button>
      </form>
      <p>
        已有帳號？ <a href="/login">去登入</a>
      </p>
    </div>
  );
}

export default RegisterPage;
