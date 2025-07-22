export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }
    try {
      const data = await request.json();
      const inputText = (data.input_text || '').trim();
      const inputType = data.input_type || 'text';
      const summaryLength = data.summary_length || 'medium';

      if (!inputText) {
        return new Response(JSON.stringify({ error: 'Input text is required' }), { status: 400 });
      }
      if (!['text', 'url'].includes(inputType)) {
        return new Response(JSON.stringify({ error: 'Invalid input type' }), { status: 400 });
      }
      if (!['short', 'medium', 'detailed'].includes(summaryLength)) {
        return new Response(JSON.stringify({ error: 'Invalid summary length' }), { status: 400 });
      }

      let textToSummarize = inputText;
      if (inputType === 'url') {
        textToSummarize = await extractTextFromUrl(inputText);
        if (!textToSummarize || textToSummarize.length < 50) {
          return new Response(JSON.stringify({ error: 'Could not extract sufficient content from URL' }), { status: 400 });
        }
      }
      if (textToSummarize.length < 50) {
        return new Response(JSON.stringify({ error: 'Text is too short to summarize' }), { status: 400 });
      }

      const prompt = `Please summarize the following text:\n\n${textToSummarize}\n\n${getLengthInstructions(summaryLength)}\n\nFocus on the main arguments, key facts, and important conclusions. Make the summary clear and well-structured.`;

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that creates clear, concise summaries of text content.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: summaryLength === 'detailed' ? 1000 : summaryLength === 'medium' ? 500 : 200,
          temperature: 0.3,
        }),
      });
      if (!openaiRes.ok) {
        const err = await openaiRes.text();
        return new Response(JSON.stringify({ error: `OpenAI error: ${err}` }), { status: 500 });
      }
      const openaiData = await openaiRes.json();
      const summary = openaiData.choices[0].message.content.trim();
      const originalWordCount = countWords(textToSummarize);
      const summaryWordCount = countWords(summary);

      return new Response(JSON.stringify({
        input_text: inputText,
        input_type: inputType,
        summary,
        summary_length: summaryLength,
        word_count_original: originalWordCount,
        word_count_summary: summaryWordCount,
      }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: `Internal server error: ${e.message}` }), { status: 500 });
    }
  }
};

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

async function extractTextFromUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
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