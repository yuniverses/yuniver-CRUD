// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 

// 若想使用 CSS 檔，這裡也可引入 e.g. import './index.css';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
