// API configuration
const API_CONFIG = {
    baseUrl: 'https://openrouter.ai/api/v1',
    endpoint: '/chat/completions',
    defaultModel: 'meta-llama/llama-3.3-8b-instruct:free',
    referer: 'https://github.com/keyurgit45/be-productive',
    title: 'Be Productive'
};

// Constants for overlay
const MOTIVATIONAL_QUOTES = [
    {
        text: "Success usually comes to those who are too busy to be looking for it.",
        author: "Henry David Thoreau"
    },
    {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
    },
    {
        text: "Don't watch the clock; do what it does. Keep going.",
        author: "Sam Levenson"
    },
    {
        text: "The future depends on what you do today.",
        author: "Mahatma Gandhi"
    },
    {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill"
    },
    {
        text: "The harder you work for something, the greater you'll feel when you achieve it.",
        author: "Unknown"
    },
    {
        text: "Don't limit your challenges. Challenge your limits.",
        author: "Unknown"
    },
    {
        text: "The only place where success comes before work is in the dictionary.",
        author: "Vidal Sassoon"
    }
];

const DARK_GRADIENTS = [
    "linear-gradient(180deg, #16243a 0%, #233554 100%)", // Original
    "linear-gradient(180deg, #1a1c2c 0%, #2d3250 100%)", // Deep Blue
    "linear-gradient(180deg, #1e1e2f 0%, #2d2d44 100%)", // Dark Navy
    "linear-gradient(180deg, #1a1f2c 0%, #2c3440 100%)", // Slate
    "linear-gradient(180deg, #1c1c2e 0%, #2d2d4a 100%)", // Royal Blue
    "linear-gradient(180deg, #1e1e2e 0%, #2d2d3f 100%)", // Midnight
    "linear-gradient(180deg, #1a1c2e 0%, #2a2d42 100%)", // Deep Space
    "linear-gradient(180deg, #1c1e2e 0%, #2b2e40 100%)"  // Dark Ocean
];

// Function to send prompt to OpenRouter API
async function sendPromptToOpenRouter(prompt) {
    // Get API key from storage
    const result = await chrome.storage.sync.get(['openRouterApiKey']);
    const apiKey = result.openRouterApiKey;

    if (!apiKey) {
        throw new Error('API key not found. Please set your OpenRouter API key in the extension settings.');
    }

    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': API_CONFIG.referer,
            'X-Title': API_CONFIG.title
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

// Function to check if URL is a YouTube watch page
function isYouTubeWatchPage(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'www.youtube.com' &&
            urlObj.pathname === '/watch' &&
            urlObj.searchParams.has('v');
    } catch (error) {
        console.error('Error parsing URL:', error);
        return false;
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);

    if (request.action === 'sendPrompt') {
        console.log('Processing sendPrompt request');

        sendPromptToOpenRouter(request.prompt)
            .then(response => {
                console.log('Sending response:', response);
                sendResponse({ success: true, response });
            })
            .catch(error => {
                console.error('Error processing prompt:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Required for async sendResponse
    }
});

// Function to remove overlay
async function removeOverlay(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                const overlay = document.getElementById('focus-extension-overlay');
                if (overlay) {
                    overlay.remove();
                }
            }
        });
    } catch (error) {
        console.error('Error removing overlay:', error);
    }
}

// Function to get video title with polling and fallbacks
async function getVideoTitle(tabId) {
    const MAX_ATTEMPTS = 10; // Maximum number of polling attempts
    const POLL_INTERVAL = 500; // Poll every 500ms
    let attempts = 0;
    let lastTitle = '';

    while (attempts < MAX_ATTEMPTS) {
        const result = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                // Try multiple methods to get the title
                const methods = [
                    // Method 1: Get from h1 element (most reliable)
                    () => document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent?.trim(),
                    // Method 2: Get from meta title
                    () => document.title.replace(' - YouTube', '').trim(),
                    // Method 3: Get from video title element
                    () => document.querySelector('#video-title')?.textContent?.trim(),
                    // Method 4: Get from any h1
                    () => document.querySelector('h1')?.textContent?.trim()
                ];

                // Try each method until we get a non-empty result
                for (const method of methods) {
                    const title = method();
                    if (title && title !== 'YouTube') {
                        return title;
                    }
                }
                return null;
            }
        });

        const currentTitle = result[0].result;

        // If we got a title
        if (currentTitle) {
            // If it's the same as last time, we can be confident it's stable
            if (currentTitle === lastTitle) {
                console.log('Title stabilized:', currentTitle);
                return currentTitle;
            }
            lastTitle = currentTitle;
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        attempts++;
    }

    // If we couldn't get a stable title, return the best we have
    console.log('Using best available title after max attempts:', lastTitle);
    return lastTitle || 'Unknown Video';
}

// Check if extension is enabled
async function isExtensionEnabled() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['enabled'], (result) => {
            const isEnabled = result.enabled !== undefined ? result.enabled : true;
            resolve(isEnabled);
        });
    });
}

// Inject overlay into YouTube video page
async function injectOverlay(tab) {
    // Check if extension is enabled
    const enabled = await isExtensionEnabled();
    if (!enabled) {
        console.log('Extension is disabled, skipping overlay injection');
        return;
    }

    // Check if URL is already being processed
    if (processingUrls.has(tab.url)) {
        console.log('URL already being processed:', tab.url);
        return;
    }

    // Add URL to processing set
    processingUrls.add(tab.url);
    console.log('Processing URL:', tab.url);

    try {
        // Get video title
        const title = await getVideoTitle(tab.id);
        console.log('Video title:', title);

        // Inject constants and title
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (quotes, gradients, videoTitle) => {
                window.__MOTIVATIONAL_QUOTES = quotes;
                window.__DARK_GRADIENTS = gradients;
                window.__tabTitle = videoTitle;
            },
            args: [MOTIVATIONAL_QUOTES, DARK_GRADIENTS, title]
        });

        // Inject main script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['src/content/youtube/youtubeOverlay.js']
        });

        // Initialize overlay
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                if (typeof createOverlay === 'function') {
                    createOverlay();
                } else {
                    console.error('createOverlay function not found');
                }
            }
        });
    } catch (error) {
        console.error('Error injecting overlay:', error);
    } finally {
        // Remove URL from processing set
        processingUrls.delete(tab.url);
        console.log('Finished processing URL:', tab.url);
    }
}

// Keep track of tabs that are being processed
const processingUrls = new Set();

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the URL has changed and the tab is complete
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated:', {
            tabId,
            url: tab.url,
            title: tab.title
        });

        // Check if it's a YouTube video page and not already being processed
        if (isYouTubeWatchPage(tab.url)) {
            console.log('YouTube video detected:', tab.url);
            injectOverlay(tab).finally(() => {
                processingUrls.delete(tab.url);
            });
        } else {
            // If not a YouTube video page, remove the overlay
            removeOverlay(tabId);
        }
    }
});

// Listen for tab activation (when user switches to a different tab)
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Get information about the newly activated tab
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        console.log('Tab activated:', {
            tabId: tab.id,
            url: tab.url,
            title: tab.title
        });

        // Check if it's a YouTube video page and not already being processed
        if (tab.url && isYouTubeWatchPage(tab.url)) {
            console.log('YouTube video detected:', tab.url);
            injectOverlay(tab).finally(() => {
                processingUrls.delete(tab.url);
            });
        } else {
            // If not a YouTube video page, remove the overlay
            removeOverlay(tab.id);
        }
    });
}); 