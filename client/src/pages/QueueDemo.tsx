import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Task {
  id: string;
  status: 'idle' | 'pending' | 'completed';
  result: string | null;
}

interface TaskResult {
  taskId: string;
  result: string;
}

function QueueDemo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize 20 tasks
    const initialTasks: Task[] = Array.from({ length: 20 }, (_, i) => ({
      id: `task-${i + 1}`,
      status: 'idle',
      result: null
    }));
    setTasks(initialTasks);

    // Connect to WebSocket
    socketRef.current = io('http://localhost:3000');

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socketRef.current.on('task-result', (data: TaskResult) => {
      setTasks(prev => prev.map(task => 
        task.id === data.taskId
          ? { ...task, status: 'completed', result: data.result }
          : task
      ));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startAllTasks = async () => {
    // Reset all tasks
    setTasks(prev => prev.map(task => ({
      ...task,
      status: 'pending',
      result: null
    })));

    // Submit all tasks
    for (const task of tasks) {
      try {
        await fetch('/api/queue/task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            taskId: task.id,
            data: { message: `Processing ${task.id}` }
          })
        });
      } catch (error) {
        console.error(`Error submitting ${task.id}:`, error);
      }
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-1 text-white">Queue Demo with WebSocket</h1>
        <p className="text-sm text-gray-400">Process tasks using worker threads and receive results via WebSocket</p>
      </div>
      
      <div className="bg-white rounded shadow-md p-6 mb-6">
        <button
          onClick={startAllTasks}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start All Tasks
        </button>
        <p className="mt-4 text-gray-600 text-sm flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Click to submit 20 tasks to the queue. They will be processed in a worker thread (2s delay) and results will be delivered via WebSocket in real-time.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tasks.map((task, index) => (
          <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Task #{index + 1}</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                {task.status.toUpperCase()}
              </span>
            </div>
            
            {task.status === 'pending' && (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600 mb-3"></div>
                <p className="text-xs text-gray-500">Processing...</p>
              </div>
            )}
            
            {task.status === 'completed' && task.result && (
              <div className="text-xs text-gray-700 bg-green-50 p-3 rounded-lg break-words leading-relaxed border border-green-100">
                {task.result}
              </div>
            )}
            
            {task.status === 'idle' && (
              <div className="flex flex-col items-center justify-center py-6">
                <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-500">Ready to start</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default QueueDemo;
