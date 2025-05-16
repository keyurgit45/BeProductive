// API configuration
const API_CONFIG = {
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-8b-instruct:free'
};

// Function to send prompt to OpenRouter API
async function sendPromptToOpenRouter(prompt) {
    // Get API key from storage
    const result = await chrome.storage.sync.get(['openRouterApiKey']);
    const apiKey = result.openRouterApiKey;

    if (!apiKey) {
        throw new Error('API key not found. Please set your OpenRouter API key in the extension settings.');
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://github.com/yourusername/focus-extension',
            'X-Title': 'Focus Extension'
        },
        body: JSON.stringify({
            model: API_CONFIG.defaultModel,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`API request failed: ${response.status} Response: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);

    if (request.action === 'sendPrompt') {
        console.log('Processing sendPrompt request');

        sendPromptToOpenRouter(request.prompt)
            .then(response => sendResponse({ success: true, response }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Required for async sendResponse
    }
}); 