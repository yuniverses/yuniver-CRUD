import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// 呼叫後端產生 PDF 報價單
export const generateQuotationPDF = async (items, clientName, projectName, token) => {
  const res = await axios.post(
    `${API_URL}/quotation`,
    { items, clientName, projectName },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob', // 取得檔案
    }
  );
  return res;
};
