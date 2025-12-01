import { parentPort, workerData } from 'worker_threads';

interface Task {
  taskId: string;
  data: any;
  timestamp: number;
}

interface WorkerData {
  task: Task;
}

interface Result {
  data: string;
  processedAt: string;
}

setTimeout(() => {
  const { task } = workerData as WorkerData;
  const result: Result = {
    data: `Processed task ${task.taskId} with data: ${JSON.stringify(task.data)}`,
    processedAt: new Date().toISOString()
  };

  parentPort!.postMessage(result);
}, 2000); // 2 second delay as specified
