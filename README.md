# BeProductive - YouTube Focus Extension

A browser extension that helps you stay focused by intelligently blocking distracting YouTube content and replacing it with motivational quotes and reminders to stay productive.

## Features

- 🤖 AI-powered content filtering using OpenRouter API
- 🎯 Customizable allowed and blocked topics
- 💭 Motivational quotes with beautiful gradient backgrounds
- 🎨 Modern, clean user interface
- ⚡ Fast performance with content caching
- 📱 Responsive design for all screen sizes

## How It Works

The extension analyzes YouTube videos in real-time using AI to determine if the content matches your productivity goals. When a distracting video is detected:

1. The video is automatically paused
2. A beautiful overlay appears with:
   - A motivational quote
   - A reminder to stay focused
   - A dynamic gradient background

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/keyurgit45/BeProductive.git
   cd BeProductive
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from this project

## Configuration

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Open the extension settings
3. Enter your OpenRouter API key
4. Configure your allowed and blocked topics

