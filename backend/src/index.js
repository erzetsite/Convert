// index.js
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import ExcelJS from 'exceljs';
import { PDFDocument, rgb } from 'pdf-lib';
import MarkdownIt from 'markdown-it';

const app = new Hono();

app.use('/convert', cors({ origin: '*', allowMethods: ['POST'] }));

app.post('/convert', async c => {
  try {
    const { format, content } = await c.req.json();
    if (!format || !content) return c.json({ error: 'format & content required' }, 400);

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    let buffer, mime, filename;

    switch (format) {
      case 'docx': {
        const doc = new Document({
          sections: [{ children: [new Paragraph({ children: [new TextRun(content)] })] }]
        });
        buffer = await Packer.toBuffer(doc);
        mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `result-${ts}.docx`;
        break;
      }
      case 'xlsx': {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Sheet1');
        ws.addRows(Array.isArray(content) ? content : [content]);
        buffer = Buffer.from(await wb.xlsx.writeBuffer());
        mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `result-${ts}.xlsx`;
        break;
      }
      case 'pdf': {
        const pdf = await PDFDocument.create();
        const page = pdf.addPage();
        page.drawText(content, { x: 50, y: page.getHeight() - 50, size: 12, color: rgb(0, 0, 0) });
        buffer = (await pdf.save()).buffer;
        mime = 'application/pdf';
        filename = `result-${ts}.pdf`;
        break;
      }
      case 'md': {
        buffer = Buffer.from(new MarkdownIt().render(content));
        mime = 'text/markdown; charset=utf-8';
        filename = `result-${ts}.md`;
        break;
      }
      case 'txt': {
        buffer = Buffer.from(content, 'utf8');
        mime = 'text/plain; charset=utf-8';
        filename = `result-${ts}.txt`;
        break;
      }
      default: return c.json({ error: 'Unsupported format' }, 400);
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

app.all('*', c => c.text('Not Found', 404));
export default app;
