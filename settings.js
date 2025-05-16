document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveSettings');
    const statusDiv = document.getElementById('status');

    // Load existing API key
    chrome.storage.sync.get(['openRouterApiKey'], (result) => {
        if (result.openRouterApiKey) {
            apiKeyInput.value = result.openRouterApiKey;
        }
    });

    // Save API key
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            showStatus('Please enter an API key', 'error');
            return;
        }

        chrome.storage.sync.set({ openRouterApiKey: apiKey }, () => {
            showStatus('Settings saved successfully!', 'success');
        });
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}); 