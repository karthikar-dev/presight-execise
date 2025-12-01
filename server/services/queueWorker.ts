import { Worker } from 'worker_threads';
import { Server } from 'socket.io';

interface QueueTask {
  taskId: string;
  data: any;
  timestamp: number;
}

interface WorkerResult {
  data: string;
  processedAt: string;
}

// In-memory queue
const queue: QueueTask[] = [];
let io: Server | null = null;

export function setSocketIO(socketIO: Server) {
  io = socketIO;
}

export function addToQueue(taskId: string, data: any) {
  queue.push({ taskId, data, timestamp: Date.now() });
  processQueue();
}

function processQueue() {
  if (queue.length === 0) return;

  const task = queue.shift()!;
  
  // Create a worker to process the task (using eval to run TypeScript code directly)
  const workerCode = `
    const { parentPort, workerData } = require('worker_threads');
    
    // Simulate processing time
    setTimeout(() => {
      const { task } = workerData;
      
      // Process the task (here we just create a mock result)
      const result = {
        data: \`Processed task \${task.taskId} with data: \${JSON.stringify(task.data)}\`,
        processedAt: new Date().toISOString()
      };
    
      parentPort.postMessage(result);
    }, 2000); // 2 second delay as specified
  `;
  
  const worker = new Worker(workerCode, {
    eval: true,
    workerData: { task }
  });

  worker.on('message', (result: WorkerResult) => {
    // Send result via WebSocket
    if (io) {
      io.emit('task-result', {
        taskId: task.taskId,
        result: result.data,
        completedAt: Date.now()
      });
    }
  });

  worker.on('error', (error: Error) => {
    console.error('Worker error:', error);
    if (io) {
      io.emit('task-result', {
        taskId: task.taskId,
        result: 'Error processing task',
        error: true,
        completedAt: Date.now()
      });
    }
  });

  worker.on('exit', (code: number) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
    // Process next task in queue
    if (queue.length > 0) {
      setTimeout(processQueue, 100);
    }
  });
}
