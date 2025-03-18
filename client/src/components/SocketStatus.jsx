// components/SocketStatus.jsx
import React from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * SocketStatus - 一個用於顯示Socket連接狀態的小組件
 * 此組件可用於測試和開發階段，在生產環境中可以隱藏
 */
const SocketStatus = () => {
  const { isConnected } = useSocket();

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      backgroundColor: isConnected ? 'rgba(0, 200, 0, 0.7)' : 'rgba(200, 0, 0, 0.7)',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 1000,
      display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
    }}>
      {isConnected ? 'Socket已連接' : 'Socket未連接'}
    </div>
  );
};

export default SocketStatus;