import express, { Request, Response } from 'express';
import { faker } from '@faker-js/faker';

const router = express.Router();

// GET /api/stream/text - Stream long text
router.get('/text', (req: Request, res: Response) => {
  // Set headers for SSE (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Generate long text
  const longText = faker.lorem.paragraphs(32);

  let index = 0;

  // Send one character at a time
  const interval = setInterval(() => {
    if (index < longText.length) {
      res.write(`data: ${JSON.stringify({ char: longText[index], complete: false })}\n\n`);
      index++;
    } else {
      // Send completion message with full text
      res.write(`data: ${JSON.stringify({ char: '', complete: true, fullText: longText })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 10); // Send every 10ms

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

export default router;
