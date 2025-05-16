import { showStatus, getStorageData } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const settingsButton = document.getElementById('settingsButton');
    const clearCacheButton = document.getElementById('clearCacheButton');
    const cachedResultsList = document.getElementById('cachedResultsList');

    // Settings button click handler
    settingsButton.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('src/options/settings.html'));
        }
    });

    // Clear cache button click handler
    clearCacheButton.addEventListener('click', async () => {
        try {
            await chrome.storage.local.remove('contentCheckCache');
            showStatus('Cache cleared successfully', 'success');
            displayCachedResults(); // Refresh the display
        } catch (error) {
            showStatus('Error clearing cache: ' + error.message, 'error');
        }
    });

    // Function to store check result in cache
    async function storeCheckResult(videoUrl, llmResponse) {
        try {
            const isBlocked = llmResponse.toLowerCase().startsWith('blocked');
            const cacheEntry = {
                result: isBlocked,
                reason: llmResponse,
                timestamp: new Date().toISOString()
            };

            // Get existing cache
            const { contentCheckCache = {} } = await chrome.storage.local.get('contentCheckCache');

            // Update cache
            contentCheckCache[videoUrl] = cacheEntry;

            // Save updated cache
            await chrome.storage.local.set({ contentCheckCache });

            // Refresh display
            displayCachedResults();
        } catch (error) {
            console.error('Error storing check result:', error);
            showStatus('Error storing check result', 'error');
        }
    }

    // Function to display cached results
    async function displayCachedResults() {
        try {
            const { contentCheckCache = {} } = await chrome.storage.local.get('contentCheckCache');

            if (Object.keys(contentCheckCache).length === 0) {
                cachedResultsList.innerHTML = '<p>No cached results found</p>';
                return;
            }

            const resultsHTML = Object.entries(contentCheckCache)
                .map(([url, data]) => {
                    const videoId = url.split('v=')[1]?.split('&')[0] || url;
                    const status = data.result ? 'Blocked' : 'Allowed';
                    const statusClass = data.result ? 'blocked' : 'allowed';

                    return `
                        <div class="cache-entry">
                            <div class="video-info">
                                <div class="video-title">${data.title}</div>
                                <div class="video-meta">
                                    <span class="video-id">ID: ${videoId}</span>
                                    <span class="status ${statusClass}">${status}</span>
                                </div>
                            </div>
                            <div class="reason">${data.reason}</div>
                            <div class="timestamp">Checked: ${new Date(data.timestamp).toLocaleString()}</div>
                        </div>
                    `;
                })
                .join('');

            cachedResultsList.innerHTML = resultsHTML;
        } catch (error) {
            console.error('Error displaying cached results:', error);
            cachedResultsList.innerHTML = '<p>Error loading cached results</p>';
        }
    }

    // Initial display of cached results
    displayCachedResults();

    // Export the storeCheckResult function for use in other files
    window.storeCheckResult = storeCheckResult;
}); 