import { OpenAI } from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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',
});

async function extractTextFromUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });
    if (!response.ok) throw new Error('Failed to fetch URL');
    const html = await response.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  } catch (e) {
    throw new Error(`Failed to extract content from URL: ${e.message}`);
  }
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function getLengthInstructions(summaryLength) {
  return {
    short: 'Provide a brief 2-3 sentence summary highlighting only the most critical points.',
    medium: 'Create a balanced summary in 1-2 paragraphs covering the main points and key details.',
    detailed: 'Generate a comprehensive summary that covers all important aspects, organized into clear paragraphs.'
  }[summaryLength] || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    let data = req.body;
    if (!data) {
      // If body is not parsed, parse it manually
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawBody = Buffer.concat(buffers).toString();
      data = JSON.parse(rawBody);
    }
    const inputText = (data.input_text || '').trim();
    const inputType = data.input_type || 'text';
    const summaryLength = data.summary_length || 'medium';

    if (!inputText) {
      return res.status(400).json({ error: 'Input text is required' });
    }
    if (!['text', 'url'].includes(inputType)) {
      return res.status(400).json({ error: 'Invalid input type' });
    }
    if (!['short', 'medium', 'detailed'].includes(summaryLength)) {
      return res.status(400).json({ error: 'Invalid summary length' });
    }

    let textToSummarize = inputText;
    if (inputType === 'url') {
      textToSummarize = await extractTextFromUrl(inputText);
      if (!textToSummarize || textToSummarize.length < 50) {
        return res.status(400).json({ error: 'Could not extract sufficient content from URL' });
      }
    }
    if (textToSummarize.length < 50) {
      return res.status(400).json({ error: 'Text is too short to summarize' });
    }

    const prompt = `Please summarize the following text:\n\n${textToSummarize}\n\n${getLengthInstructions(summaryLength)}\n\nFocus on the main arguments, key facts, and important conclusions. Make the summary clear and well-structured.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that creates clear, concise summaries of text content.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: summaryLength === 'detailed' ? 1000 : summaryLength === 'medium' ? 500 : 200,
      temperature: 0.3,
    });

    const summary = completion.choices[0].message.content.trim();
    const originalWordCount = countWords(textToSummarize);
    const summaryWordCount = countWords(summary);

    return res.status(200).json({
      input_text: inputText,
      input_type: inputType,
      summary,
      summary_length: summaryLength,
      word_count_original: originalWordCount,
      word_count_summary: summaryWordCount,
    });
  } catch (e) {
    return res.status(500).json({ error: `Internal server error: ${e.message}` });
  }
} 