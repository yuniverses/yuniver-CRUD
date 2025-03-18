// utils/pdfGenerator.js
const PDFDocument = require('pdfkit-cjk');
const moment = require('moment');
const fs = require('fs');

exports.generatePDF = (quotationData) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        clientName = '',
        projectName = '',
        subject = '',
        date = moment().format('YYYY-MM-DD'),
        timeValues = { startDate: '', midDate: '', endDate: '' },
        items = [],
        notes = '',
        customFields = [],
        total = 0
      } = quotationData;

      // 創建 PDF 文檔，使用pdfkit-cjk支援中文
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `${clientName} 報價單`,
          Author: 'YUNIVER',
          Subject: projectName
        },
        font: 'Source Han Sans', // 使用思源黑體
        lang: 'zh-TW'
      });

      // 使用 Buffer 來收集數據，而不是使用 doc.on 事件
      // 創建一個臨時文件路徑
      const tempFilePath = `./temp-${Date.now()}.pdf`;
      const writeStream = fs.createWriteStream(tempFilePath);
      
      // 導向 PDF 輸出到文件流
      doc.pipe(writeStream);
      
      // 文件寫入完成後讀取並返回
      writeStream.on('finish', () => {
        fs.readFile(tempFilePath, (err, data) => {
          // 刪除臨時文件
          fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr) console.error('刪除臨時文件失敗:', unlinkErr);
          });
          
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      // 頂部標題區域
      doc.fontSize(32).text('YUNIVER', 50, 50);
      doc.fontSize(10).text('®', 180, 45, { superscript: true });
      doc.fontSize(12).text('quotation', 495, 50, { align: 'right' });
      
      // 聯絡資訊
      doc.fontSize(10);
      doc.text('Guanyu Chen', 50, 90);
      doc.text('https://yuniverses.com/', 50, 105);
      doc.text('(+81) 070 3349 0711', 50, 120);
      doc.text('guanyu@yuniverses.com', 50, 135);

      // 分隔線
      drawLine(doc, 165);

      // 客戶區域
      doc.fontSize(10).text('For:', 50, 175);
      doc.fontSize(16).text(clientName || '客戶名稱', 50, 190);

      // 分隔線
      drawLine(doc, 225);

      // 主題和日期
      doc.fontSize(10).text('Subject:', 50, 235);
      doc.fontSize(10).text(date, 495, 235, { align: 'right' });
      doc.fontSize(16).text(subject || projectName || '專案名稱', 50, 250);

      // 分隔線
      drawLine(doc, 285);

      // 時間區間
      doc.fontSize(10).text('Time:', 50, 295);
      doc.fontSize(10).text(timeValues.startDate || '', 80, 310);
      doc.fontSize(10).text(timeValues.midDate || '', 240, 310);
      doc.fontSize(10).text(timeValues.endDate || '', 400, 310);

      // 自訂欄位
      let currentY = 340;
      if (customFields && customFields.some(field => field.title || field.content)) {
        drawLine(doc, currentY);
        currentY += 15;
        
        for (const field of customFields) {
          if (field.title || field.content) {
            if (field.title) {
              doc.fontSize(10).text(`${field.title}:`, 50, currentY);
              currentY += 15;
            }
            if (field.content) {
              doc.fontSize(12).text(field.content, 50, currentY);
              currentY += 20;
            }
          }
        }
      }

      // 表格標題
      drawLine(doc, currentY);
      currentY += 20;
      
      doc.fontSize(10);
      doc.text('類型', 50, currentY);
      doc.text('項目', 130, currentY);
      doc.text('描述', 250, currentY);
      doc.text('價格 (新台幣)', 495, currentY, { align: 'right' });
      
      currentY += 15;
      drawLine(doc, currentY);
      currentY += 15;
      
      // 表格內容
      for (const item of items) {
        // 檢查是否需要換頁
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        const typeText = item.type || '';
        const nameText = item.name || '';
        const descText = item.description || '';
        const price = parseFloat(item.price) || 0;
        
        // 根據類型顯示中文名稱
        let typeDisplay = typeText;
        switch(typeText.toLowerCase()) {
          case 'design': typeDisplay = '設計'; break;
          case 'develop': typeDisplay = '開發'; break;
          case 'maintenance': typeDisplay = '維護'; break;
          case 'consulting': typeDisplay = '顧問'; break;
          case 'other': typeDisplay = '其他'; break;
        }
        
        doc.fontSize(10).text(typeDisplay, 50, currentY, { width: 70 });
        doc.text(nameText, 130, currentY, { width: 110 });
        doc.text(descText, 250, currentY, { width: 190 });
        doc.text(`$${price.toLocaleString()}`, 495, currentY, { align: 'right' });
        
        currentY += 30;
        doc.strokeColor('#dddddd')
          .moveTo(50, currentY - 10)
          .lineTo(550, currentY - 10)
          .stroke()
          .strokeColor('#000000');
      }
      
      // 總計
      currentY += 10;
      doc.fontSize(12).text(`總價：$${parseFloat(total).toLocaleString()}`, 495, currentY, { align: 'right' });
      
      // 備註
      if (notes) {
        currentY += 20;
        doc.fontSize(8).text(notes, 495, currentY, { align: 'right' });
      }
      
      currentY += 20;
      drawLine(doc, currentY);
      
      // 頁腳
      currentY += 60;
      doc.lineWidth(2)
        .moveTo(50, currentY)
        .lineTo(550, currentY)
        .stroke()
        .lineWidth(1);
      
      // 完成 PDF
      doc.end();
    } catch (err) {
      console.error('PDF 生成錯誤:', err);
      reject(err);
    }
  });
};

// 畫一條細線
function drawLine(doc, y) {
  doc.moveTo(50, y).lineTo(550, y).stroke();
}