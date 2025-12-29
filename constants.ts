import { FeedbackItem, Platform } from './types';

export const MOCK_FEEDBACK: FeedbackItem[] = [
  {
    id: '1',
    platform: Platform.X,
    username: '@code_nomad',
    content: 'Is this using the new Gemini Flash model? The latency looks incredible.',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    type: 'question',
    threadId: 'post-1',
    threadTitle: 'Refactoring the auth flow for speed'
  },
  {
    id: '2',
    platform: Platform.REDDIT,
    username: 'u/rust_never_sleeps',
    content: 'Great writeup. I found a small race condition in the useEffect hook you posted though.',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    type: 'bug',
    threadId: 'post-1',
    threadTitle: 'Refactoring the auth flow for speed'
  },
  {
    id: '3',
    platform: Platform.X,
    username: '@ship_it_daily',
    content: 'Love the brutalist aesthetic. 🧡',
    timestamp: Date.now() - 1000 * 60 * 60,
    type: 'positive',
    threadId: 'post-1',
    threadTitle: 'Refactoring the auth flow for speed'
  },
  {
    id: '4',
    platform: Platform.REDDIT,
    username: 'u/dev_advocate',
    content: 'Would love to see a comparison with other tools.',
    timestamp: Date.now() - 1000 * 60 * 120,
    type: 'request',
    threadId: 'post-2',
    threadTitle: 'Initial commit: Project Genesis'
  }
];

export const SAMPLE_CODE_SNIPPET = `
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: 'Generate a brutalist UI component',
});
console.log(response.text);
`.trim();
