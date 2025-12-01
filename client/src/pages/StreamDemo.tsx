import { useState } from 'react';

interface StreamData {
  char?: string;
  complete?: boolean;
  fullText?: string;
}

function StreamDemo() {
  const [text, setText] = useState('');
  const [fullText, setFullText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [complete, setComplete] = useState(false);

  const startStream = async () => {
    setText('');
    setFullText('');
    setComplete(false);
    setStreaming(true);

    try {
      const response = await fetch('/api/stream/text');
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }
      
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data: StreamData = JSON.parse(line.substring(6));
            
            if (data.complete && data.fullText) {
              setFullText(data.fullText);
              setComplete(true);
              setStreaming(false);
            } else if (data.char) {
              setText(prev => prev + data.char);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      setStreaming(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-1 text-white">Stream Demo</h1>
        <p className="text-sm text-gray-400">Watch text stream character by character using Server-Sent Events</p>
      </div>
      
      <div className="bg-white rounded shadow-md p-6 mb-6">
        <button
          onClick={startStream}
          disabled={streaming}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
        >
          {streaming ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Streaming...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Stream
            </>
          )}
        </button>
      </div>

      {!complete && text && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
            <h2 className="font-bold text-gray-800">Streaming in Progress...</h2>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed font-mono text-sm bg-gray-50 p-4 rounded-lg">
            {text}
            {streaming && <span className="animate-pulse text-blue-600 font-bold">|</span>}
          </div>
        </div>
      )}

      {complete && fullText && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="font-bold text-green-800 text-lg">Stream Complete!</h2>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-white p-5 rounded-lg border border-green-100">{fullText}</div>
        </div>
      )}
    </div>
  );
}

export default StreamDemo;
