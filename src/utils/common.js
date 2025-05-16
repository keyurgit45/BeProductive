// Common UI utilities
export const showStatus = (message, type, elementId = 'status') => {
    const statusDiv = document.getElementById(elementId);
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 7000);
};

// Storage utilities
export const getStorageData = async (keys) => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(keys, (result) => resolve(result));
    });
};

export const setStorageData = async (data) => {
    return new Promise((resolve) => {
        chrome.storage.sync.set(data, resolve);
    });
};
