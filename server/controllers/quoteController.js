// controllers/quoteController.js
const { generatePDF } = require('../utils/pdfGenerator');

exports.generateQuotation = async (req, res) => {
  try {
    const { items, clientName, projectName } = req.body;
    // items = [{ description: '項目1', price: 1000 }, { ... }, ... ]

    // 呼叫 PDF 產生工具
    const pdfBuffer = await generatePDF({ items, clientName, projectName });

    // 設定回應標頭並傳送 PDF 檔案
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=quotation.pdf');
    res.send(pdfBuffer);

  } catch (err) {
    res.status(500).json({ message: 'Failed to generate quotation PDF' });
  }
};
