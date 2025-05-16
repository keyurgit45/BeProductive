document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt');
    const sendButton = document.getElementById('sendButton');
    const responseDiv = document.getElementById('response');
    const statusDiv = document.getElementById('status');
    const settingsButton = document.getElementById('settingsButton');

    // Check API key on load
    checkApiKey();

    // Settings button click handler
    settingsButton.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('settings.html'));
        }
    });

    // Send button click handler
    sendButton.addEventListener('click', handleSend);

    // Enter key handler
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    async function checkApiKey() {
        const result = await chrome.storage.sync.get(['openRouterApiKey']);
        if (!result.openRouterApiKey) {
            showStatus('Please set your OpenRouter API key in settings', 'error');
            sendButton.disabled = true;
        } else {
            sendButton.disabled = false;
        }
    }

    async function handleSend() {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showStatus('Please enter a prompt', 'error');
            return;
        }

        try {
            sendButton.disabled = true;
            responseDiv.textContent = 'Loading...';
            showStatus('Sending request...', 'success');

            const response = await chrome.runtime.sendMessage({
                action: 'sendPrompt',
                prompt: prompt
            });

            if (response.success) {
                responseDiv.textContent = response.response;
                showStatus('Response received', 'success');
                promptInput.value = '';
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            responseDiv.textContent = '';
            showStatus(error.message, 'error');
        } finally {
            sendButton.disabled = false;
        }
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}); 