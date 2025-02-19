import React, { useState } from 'react';
import { generateQuotationPDF } from '../api/quotation';

function QuotationPage() {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [items, setItems] = useState([
    // 預設 1 筆
    { description: '設計項目1', price: 5000 },
  ]);

  const token = localStorage.getItem('token');

  const handleDownloadPDF = async () => {
    try {
      // 從 state items 產生 PDF
      const res = await generateQuotationPDF(items, clientName, projectName, token);
      // 建立 Blob
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'quotation.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('報價單產生失敗');
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', price: 0 }]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>報價單產生 (PDF)</h2>
      <div>
        <label>客戶名稱： </label>
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      </div>
      <div>
        <label>專案名稱： </label>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      <hr />
      <h3>項目列表</h3>
      {items.map((item, idx) => (
        <div key={idx}>
          <label>描述： </label>
          <input
            value={item.description}
            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
            style={{ width: '200px', marginRight: '8px' }}
          />
          <label>費用： </label>
          <input
            type="number"
            value={item.price}
            onChange={(e) =>
              handleItemChange(idx, 'price', parseInt(e.target.value, 10) || 0)
            }
            style={{ width: '80px' }}
          />
        </div>
      ))}
      <button onClick={addItem} style={{ margin: '8px 0' }}>
        新增項目
      </button>

      <hr />
      <button onClick={handleDownloadPDF}>產生並下載 PDF</button>
    </div>
  );
}

export default QuotationPage;
