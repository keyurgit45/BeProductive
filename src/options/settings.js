import { showStatus, getStorageData, setStorageData } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const allowedTopicsInput = document.getElementById('allowedTopics');
    const blockedTopicsInput = document.getElementById('blockedTopics');
    const saveButton = document.getElementById('saveSettings');
    const statusDiv = document.getElementById('status');
    const enableExtensionToggle = document.getElementById('enableExtension');
    const toggleStatusSpan = document.getElementById('toggleStatus');

    // Load existing settings
    getStorageData(['openRouterApiKey', 'allowedTopics', 'blockedTopics', 'enabled']).then(result => {
        if (result.openRouterApiKey) {
            apiKeyInput.value = result.openRouterApiKey;
        }
        if (result.allowedTopics) {
            allowedTopicsInput.value = result.allowedTopics.join('\n');
        }
        if (result.blockedTopics) {
            blockedTopicsInput.value = result.blockedTopics.join('\n');
        }
        const isEnabled = result.enabled !== undefined ? result.enabled : true; // Default to enabled
        enableExtensionToggle.checked = isEnabled;
        toggleStatusSpan.textContent = isEnabled ? 'Enabled' : 'Disabled';
    });

    // Save settings
    saveButton.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const allowedTopics = allowedTopicsInput.value.trim().split('\n').filter(topic => topic.trim());
        const blockedTopics = blockedTopicsInput.value.trim().split('\n').filter(topic => topic.trim());

        if (!apiKey) {
            showStatus('Please enter an API key', 'error');
            return;
        }

        try {
            await setStorageData({
                openRouterApiKey: apiKey,
                allowedTopics: allowedTopics,
                blockedTopics: blockedTopics,
                enabled: enableExtensionToggle.checked
            });
            showStatus('Settings saved successfully!', 'success');
        } catch (error) {
            showStatus('Error saving settings: ' + error.message, 'error');
        }
    });

    enableExtensionToggle.addEventListener('change', () => {
        toggleStatusSpan.textContent = enableExtensionToggle.checked ? 'Enabled' : 'Disabled';
    });
}); 