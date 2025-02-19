// utils/pdfGenerator.js
const PDFDocument = require('pdfkit');
const moment = require('moment');

exports.generatePDF = ({ items, clientName, projectName }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4' });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // 報價單標頭
      doc.fontSize(20).text('報價單', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`客戶名稱：${clientName}`);
      doc.text(`專案名稱：${projectName}`);
      doc.text(`日期：${moment().format('YYYY-MM-DD')}`);
      doc.moveDown();

      // 表格 (簡易呈現)
      items.forEach((item) => {
        doc.text(`${item.description} - NT$${item.price}`);
      });

      const total = items.reduce((sum, item) => sum + item.price, 0);
      doc.moveDown();
      doc.fontSize(14).text(`總金額：NT$${total}`, { align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
