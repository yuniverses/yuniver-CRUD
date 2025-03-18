// contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// 建立Socket Context
const SocketContext = createContext();

// 從環境變數或預設值取得 API URL - 確保不包含路徑部分
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// 檢查並去除URL末尾的任何路徑，確保我們只使用主機和端口
const getBaseUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.protocol}//${parsedUrl.host}`;
  } catch (error) {
    console.error('解析URL失敗，使用原始值', error);
    return url;
  }
};

const BASE_SOCKET_URL = getBaseUrl(SOCKET_URL);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('初始化Socket.IO連接到:', BASE_SOCKET_URL);
    
    // 建立socket連接 - 不包含任何命名空間，使用根路徑
    const socketInstance = io(BASE_SOCKET_URL, {
      transports: ['websocket', 'polling'], // 先嘗試WebSocket，但也支援輪詢作為後備
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io', // 明確指定默認路徑
    });
    
    console.log('Socket.IO實例已創建');

    // 設置連接事件處理程序
    socketInstance.on('connect', () => {
      console.log('Socket.IO connected:', socketInstance.id);
      setIsConnected(true);
    });
    
    // 監聽歡迎事件，確認服務器連接
    socketInstance.on('welcome', (data) => {
      console.log('歡迎消息從服務器收到:', data);
      // 確認連接成功
      setIsConnected(true);
    });
    
    // 監聽房間加入確認
    socketInstance.on('room_joined', (data) => {
      console.log('成功加入房間:', data);
    });
    
    // 監聽房間離開確認
    socketInstance.on('room_left', (data) => {
      console.log('成功離開房間:', data);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      console.error('Error details:', {
        message: error.message,
        description: error.description,
        type: error.type,
        context: BASE_SOCKET_URL
      });
      setIsConnected(false);
    });
    
    // 監聽額外的錯誤事件
    socketInstance.on('error', (error) => {
      console.error('Socket.IO general error:', error);
      setIsConnected(false);
    });
    
    socketInstance.on('reconnect_error', (error) => {
      console.error('Socket.IO reconnection error:', error);
      setIsConnected(false);
    });
    
    socketInstance.on('reconnect_failed', () => {
      console.error('Socket.IO failed to reconnect after all attempts');
      setIsConnected(false);
    });

    // 儲存socket實例
    setSocket(socketInstance);

    // 清理函數
    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        socketInstance.disconnect();
      }
    };
  }, []);

  // 提供加入專案房間的方法
  const joinProjectRoom = (projectId) => {
    if (socket && isConnected && projectId) {
      console.log(`Joining project room: ${projectId}`);
      socket.emit('join_project', projectId);
    }
  };

  // 提供離開專案房間的方法
  const leaveProjectRoom = (projectId) => {
    if (socket && isConnected && projectId) {
      console.log(`Leaving project room: ${projectId}`);
      socket.emit('leave_project', projectId);
    }
  };

  // 提供標記訊息已讀的方法
  const markMessagesAsRead = (projectId) => {
    if (socket && isConnected && projectId) {
      console.log(`Marking messages as read in project: ${projectId}`);
      socket.emit('mark_messages_read', projectId);
    }
  };

  // 提供Context值
  const value = {
    socket,
    isConnected,
    joinProjectRoom,
    leaveProjectRoom,
    markMessagesAsRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// 使用Socket的自定義Hook
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};