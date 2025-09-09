import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Packer } from 'docx';
import { Document, Paragraph, TextRun } from 'docx';
import ExcelJS from 'exceljs';
import { PDFDocument, rgb } from 'pdf-lib';

const app = new Hono();

// Add CORS middleware to allow requests from the frontend domain
app.use('/convert', cors({
  origin: 'https://convert.rzsite.my.id',
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

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
        const doc = new Document({
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
        buffer = await Packer.toBuffer(doc);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `converted-${timestamp}.docx`;
        break;

      case 'xlsx':
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');
        worksheet.getCell('A1').value = content;
        buffer = await workbook.xlsx.writeBuffer();
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileName = `converted-${timestamp}.xlsx`;
        break;

      case 'pdf':
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        page.drawText(content, {
          x: 50,
          y: height - 50,
          size: 12,
          color: rgb(0, 0, 0),
        });
        const pdfBytes = await pdfDoc.save();
        buffer = pdfBytes.buffer;
        contentType = 'application/pdf';
        fileName = `converted-${timestamp}.pdf`;
        break;

      case 'md':
        buffer = new TextEncoder().encode(content);
        contentType = 'text/markdown; charset=utf-8';
        fileName = `converted-${timestamp}.md`;
        break;

      case 'txt':
        buffer = new TextEncoder().encode(content);
        contentType = 'text/plain; charset=utf-8';
        fileName = `converted-${timestamp}.txt`;
        break;

      default:
        return c.json({ error: 'Unsupported format' }, 400);
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Conversion Error:', error);
    return c.json({ error: 'An internal error occurred during conversion.' }, 500);
  }
});

app.all('*', () => new Response('Not Found', { status: 404 }));

export default app;
