// Function to get a random quote
function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * window.__MOTIVATIONAL_QUOTES.length);
    return window.__MOTIVATIONAL_QUOTES[randomIndex];
}

// Function to get a random gradient
function getRandomGradient() {
    const randomIndex = Math.floor(Math.random() * window.__DARK_GRADIENTS.length);
    return window.__DARK_GRADIENTS[randomIndex];
}

// Function to check if video should be blocked
async function shouldBlockVideo() {
    // Get title from window title (removes " - YouTube" suffix)
    const videoTitle = window.__tabTitle;

    // Try multiple selectors for channel name
    const channelName = document.querySelector('#owner-name a, #channel-name a, #channel-header a')?.textContent?.trim() || '';

    console.log('Video info:', { videoTitle, channelName });

    // Get current video URL
    const videoUrl = window.location.href;

    // Check cache first
    const { contentCheckCache = {} } = await chrome.storage.local.get('contentCheckCache');
    if (contentCheckCache[videoUrl]) {
        console.log('Using cached result for:', { videoUrl, videoTitle, channelName });
        return contentCheckCache[videoUrl].result;
    }

    // Get settings from storage
    const result = await chrome.storage.sync.get(['openRouterApiKey', 'allowedTopics', 'blockedTopics']);
    const { openRouterApiKey, allowedTopics = [], blockedTopics = [] } = result;

    if (!openRouterApiKey) {
        console.error('OpenRouter API key not found');
        return false;
    }

    if (allowedTopics.length === 0 && blockedTopics.length === 0) {
        console.error('No allowed or blocked topics found');
        return false;
    }

    // Prepare the prompt
    const prompt = `As a content filter, determine if a YouTube video should be allowed or blocked based on defined topics.

    ALLOWED TOPICS: ${allowedTopics.join(', ')}
    BLOCKED TOPICS: ${blockedTopics.join(', ')}

    VIDEO:
    Title: ${videoTitle}
    Channel: ${channelName}

    RULES:
    1. If content matches ANY blocked topic, mark BLOCKED
    2. If content matches allowed topics AND no blocked topics, mark ALLOWED
    3. If unclear, default to BLOCKED
    4. For mixed content, classify by primary educational value, not production style
    5. Judge by content substance, not channel reputation or presentation style

    RESPOND ONLY WITH:
    "ALLOWED: [brief explanation]" OR "BLOCKED: [brief explanation]"`;

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'sendPrompt',
            prompt: prompt
        });

        if (response.success) {
            const llmResponse = response.response;
            const isBlocked = llmResponse.toLowerCase().startsWith('blocked');

            // Store result in cache with metadata
            const cacheEntry = {
                result: isBlocked,
                reason: llmResponse,
                timestamp: new Date().toISOString(),
                title: videoTitle,
                channel: channelName
            };

            contentCheckCache[videoUrl] = cacheEntry;
            await chrome.storage.local.set({ contentCheckCache });

            console.log('Content check result cached:', cacheEntry);
            return isBlocked;
        }
    } catch (error) {
        console.error('Error checking video content:', error);
    }

    return false;
}

// Function to remove overlay
function removeOverlay() {
    const overlay = document.getElementById('focus-extension-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Create and inject the overlay
async function createOverlay() {
    // Check if video should be blocked
    const shouldBlock = await shouldBlockVideo();
    if (!shouldBlock) {
        console.log('Video is allowed based on content check');
        return;
    }

    // Remove any existing overlay first
    removeOverlay();

    // Pause the video first
    const video = document.querySelector('video');
    console.log('Video:', video);
    if (video) {
        video.pause();

        // Print status every 1 second until paused or 30 seconds have passed
        const intervalId = setInterval(() => {
            console.log('Video paused status:', video.paused);
            if (video.paused) {
                clearInterval(intervalId);
                clearTimeout(timeoutId);
                console.log('Video is now paused.');
            }
        }, 1000);

        // Stop checking after 30 seconds
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            console.log('Stopped checking video status after 30 seconds.');
        }, 30000);
    }

    // Get a random quote and gradient
    const quote = getRandomQuote();
    const gradient = getRandomGradient();

    const overlay = document.createElement('div');
    overlay.id = 'focus-extension-overlay';
    overlay.innerHTML = `
        <div class="focus-overlay-content">
            <div class="focus-emoji">\uD83D\uDCBC</div>
            <h1>Work On Success,<br>Not YouTube</h1>
            <div class="focus-quote">"${quote.text}"<br><span class="focus-author">– ${quote.author}</span></div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #focus-extension-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${gradient};
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        .focus-overlay-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: none;
            box-shadow: none;
            border-radius: 0;
            padding: 0;
        }
        .focus-emoji {
            font-size: 5.5rem;
            margin-bottom: 2.5rem;
        }
        h1 {
            color: #fff;
            font-size: 3.2rem;
            font-weight: 700;
            text-align: center;
            margin: 0 0 2.5rem 0;
            line-height: 1.2;
        }
        .focus-quote {
            color: #bfc9d8;
            font-size: 1.6rem;
            text-align: center;
            margin-bottom: 2rem;
            margin-top: 0.2rem;
            max-width: 900px;
            line-height: 1.6;
        }
        .focus-author {
            display: block;
            margin-top: 1rem;
            font-size: 1.4rem;
            color: #7e8ba3;
        }
        @media (max-width: 600px) {
            h1 { font-size: 2.2rem; }
            .focus-emoji { font-size: 3.5rem; }
            .focus-quote { font-size: 1.4rem; }
            .focus-author { font-size: 1.2rem; }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);
}

// Create the overlay immediately when the script is injected
createOverlay(); 