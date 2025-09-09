import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Packer } from 'docx';
import { Document, Paragraph, TextRun } from 'docx';
import ExcelJS from 'exceljs';
import { PDFDocument, rgb } from 'pdf-lib';

const app = new Hono();

// Add CORS middleware to allow requests from the frontend domain
app.use('/convert', cors({
  origin: ['https://convert.rzsite.my.id', 'http://localhost:3000', 'http://127.0.0.1:3000', '*'], // Allow all for testing
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

// LaTeX to DOCX conversion helper
function createLatexDocument(latexContent) {
  const titleMatch = latexContent.match(/\\title\{([^}]+)\}/);
  const title = titleMatch ? titleMatch[1] : 'Document';
  
  const plainText = latexContent
    .replace(/\\documentclass\{[^}]+\}/g, '')
    .replace(/\\usepackage\{[^}]+\}/g, '')
    .replace(/\\title\{[^}]+\}/g, '')
    .replace(/\\begin\{document\}/g, '')
    .replace(/\\end\{document\}/g, '')
    .replace(/\\maketitle/g, title)
    .trim();

  return new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun(plainText)],
          }),
        ],
      },
    ],
  });
}

// JSON to Excel conversion helper
function createExcelFromJSON(jsonData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  
  try {
    const data = JSON.parse(jsonData);
    
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      
      data.forEach(item => {
        worksheet.addRow(headers.map(header => item[header]));
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        worksheet.addRow([key, value]);
      });
    } else {
      worksheet.getCell('A1').value = jsonData;
    }
  } catch (error) {
    worksheet.getCell('A1').value = jsonData;
  }
  
  return workbook;
}

app.post('/convert', async (c) => {
  try {
    const { format, content } = await c.req.json();

    if (!format || !content) {
      return c.json({ error: 'Missing format or content' }, 400);
    }

    let buffer, contentType, fileName;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (format) {
      case 'docx':
        let doc;
        
        if (content.includes('\\documentclass') || content.includes('\\begin{document}')) {
          doc = createLatexDocument(content);
        } else {
          doc = new Document({
            sections: [
              {
                properties: {},
                children: [
                  new Paragraph({
                    children: [new TextRun(content)],
                  }),
                ],
              },
            ],
          });
        }
        
        buffer = await Packer.toBuffer(doc);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `document-${timestamp}.docx`;
        break;

      case 'xlsx':
        let workbook;
        
        if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
          workbook = createExcelFromJSON(content);
        } else {
          workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Sheet 1');
          worksheet.getCell('A1').value = content;
        }
        
        buffer = await workbook.xlsx.writeBuffer();
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `spreadsheet-${timestamp}.xlsx`;
        break;

      case 'pdf':
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        
        const fontSize = 12;
        const lineHeight = fontSize * 1.5;
        const margin = 50;
        
        const lines = content.split('\n');
        let y = height - margin;
        
        lines.forEach(line => {
          if (y > margin) {
            page.drawText(line, {
              x: margin,
              y: y,
              size: fontSize,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
          }
        });
        
        const pdfBytes = await pdfDoc.save();
        buffer = pdfBytes.buffer;
        contentType = 'application/pdf';
        fileName = `document-${timestamp}.pdf`;
        break;

      case 'md':
        buffer = new TextEncoder().encode(content);
        contentType = 'text/markdown; charset=utf-8';
        fileName = `document-${timestamp}.md`;
        break;

      case 'txt':
        buffer = new TextEncoder().encode(content);
        contentType = 'text/plain; charset=utf-8';
        fileName = `document-${timestamp}.txt`;
        break;

      default:
        return c.json({ error: 'Unsupported format' }, 400);
    }

    // 🔥 FIXED: Proper response headers for file download
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Expose-Headers': 'Content-Disposition',
      },
    });

  } catch (error) {
    console.error('Conversion Error:', error);
    return c.json({ error: 'An internal error occurred during conversion.' }, 500);
  }
});

app.all('*', () => new Response('Not Found', { status: 404 }));

export default app;
