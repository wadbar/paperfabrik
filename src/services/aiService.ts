/**
 * PaperFabrik AI Compute Client
 * Handles streaming communication with the Gemini backend.
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class AIService {
  static async *streamChat(message: string, history: ChatMessage[] = [], signal?: AbortSignal) {
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
      signal
    });

    if (!response.ok) {
      throw new Error(`AI_COMPUTE_ERROR: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body in response');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          throw new Error('AbortError');
        }
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) yield parsed.text;
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {
              console.error('Parse error in AI stream:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
