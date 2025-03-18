// controllers/quoteController.js
const { generatePDF } = require('../utils/pdfGenerator');

exports.generateQuotation = async (req, res) => {
  try {
    const quotationData = req.body;
    // quotationData = { 
    //   clientName, projectName, subject, date, timeValues,
    //   items: [{ type, name, description, price }],
    //   notes, customFields, total 
    // }

    // 呼叫 PDF 產生工具
    const pdfBuffer = await generatePDF(quotationData);

    // 設定回應標頭並傳送 PDF 檔案
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${quotationData.clientName || 'quotation'}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("PDF 產生錯誤:", err);
    res.status(500).json({ message: 'Failed to generate quotation PDF' });
  }
};