/**
 * AI Summary Service for Chat Save extension
 * Supports OpenAI, Anthropic, and Google Gemini APIs
 */

(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});

  const PROVIDER_CONFIGS = {
    openai: {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      buildRequest: (apiKey, messages, systemPrompt) => ({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: messages }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      }),
      parseResponse: (data) => data.choices?.[0]?.message?.content || ''
    },
    anthropic: {
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-haiku-20240307',
      buildRequest: (apiKey, messages, systemPrompt) => ({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: messages }]
        })
      }),
      parseResponse: (data) => data.content?.[0]?.text || ''
    },
    gemini: {
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      model: 'gemini-2.0-flash',
      buildRequest: (apiKey, messages, systemPrompt) => ({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\n---\n\n${messages}` }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000
          }
        })
      }),
      getEndpoint: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }
  };

  const LANGUAGE_INSTRUCTIONS = {
    auto: 'Respond in the same language as the conversation.',
    en: 'Respond in English.',
    zh: 'Respond in Chinese (简体中文).',
    ja: 'Respond in Japanese (日本語).'
  };

  function buildSystemPrompt(language = 'auto') {
    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.auto;
    
    return `You are a conversation analyst. Your task is to analyze an AI conversation and extract key insights.

${langInstruction}

Please provide:

1. **💡 Key Insights** (2-4 bullet points)
   - The most important takeaways from this conversation
   - Focus on actionable insights, unique perspectives, or valuable information

2. **✨ Notable Quotes** (1-3 quotes)
   - Extract the most insightful or memorable quotes from the AI's responses
   - Keep quotes concise (1-2 sentences max)

3. **📋 Summary** (2-3 sentences)
   - A brief overview of what this conversation covers
   - Include the main topic and key conclusions

Format your response EXACTLY like this (use the exact headers):

## 💡 Key Insights

- [insight 1]
- [insight 2]
- [insight 3]

## ✨ Notable Quotes

> "[quote 1]"

> "[quote 2]"

## 📋 Summary

[Your 2-3 sentence summary here]`;
  }

  function formatMessagesForSummary(messages) {
    return messages
      .map((msg) => {
        const role = (msg.role || 'unknown').toUpperCase();
        const content = msg.content || '';
        return `[${role}]\n${content}`;
      })
      .join('\n\n---\n\n');
  }

  async function generateSummary(messages, settings) {
    const { aiProvider, apiKey, summaryLanguage } = settings;
    
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const providerConfig = PROVIDER_CONFIGS[aiProvider];
    if (!providerConfig) {
      throw new Error(`Unknown AI provider: ${aiProvider}`);
    }

    const formattedMessages = formatMessagesForSummary(messages);
    const systemPrompt = buildSystemPrompt(summaryLanguage);
    const requestConfig = providerConfig.buildRequest(apiKey, formattedMessages, systemPrompt);
    
    // Gemini uses query param for API key
    const endpoint = providerConfig.getEndpoint 
      ? providerConfig.getEndpoint(apiKey) 
      : providerConfig.endpoint;

    try {
      const response = await fetch(endpoint, requestConfig);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        throw new Error(`API error: ${errorMessage}`);
      }

      const data = await response.json();
      const summary = providerConfig.parseResponse(data);
      
      if (!summary) {
        throw new Error('Empty response from AI');
      }

      return summary.trim();
    } catch (err) {
      if (err.message.includes('API error')) {
        throw err;
      }
      throw new Error(`Failed to generate summary: ${err.message}`);
    }
  }

  async function getSummarySettings() {
    try {
      const result = await chrome.storage.sync.get({
        enableSummary: false,
        aiProvider: 'openai',
        apiKey: '',
        summaryLanguage: 'auto'
      });
      return result;
    } catch (err) {
      console.warn('[ChatSave] Failed to load summary settings:', err);
      return { enableSummary: false };
    }
  }

  // Export functions
  root.generateSummary = generateSummary;
  root.getSummarySettings = getSummarySettings;
})();
