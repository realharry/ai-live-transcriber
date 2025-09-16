# AI Live Transcriber

A Chrome extension that listens to the audio sound, from the Browser or from the surroundings, and transcribes it into text using LLM models/services. The extension features a side panel UI for easy access to transcription settings, as well as additional functionalities like summarizing the transcribed text and downloading it as a file.

## Features

- **Live Audio Transcription**: Record and transcribe audio from microphone or browser tab
- **Multiple Language Support**: Support for English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, and Chinese
- **AI Models**: Configurable AI models for transcription (OpenAI Whisper, Google Speech-to-Text, Azure Speech Services)
- **Side Panel Interface**: Easy-to-use side panel with intuitive controls
- **Text Summarization**: AI-powered summarization of transcribed text
- **Download Transcriptions**: Export transcribed text as files
- **Settings Page**: Comprehensive options for language, model, and privacy settings
- **Storage Management**: Local storage of transcriptions with privacy controls

## Tech Stack

- **TypeScript** - Type-safe development
- **React** - Modern UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality UI components
- **Vite** - Fast build tool and development server
- **Chrome Extension API** - Manifest V3 support

## Installation

### For Development

1. Clone the repository:
   ```bash
   git clone https://github.com/realharry/ai-live-transcriber.git
   cd ai-live-transcriber
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
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

### For Production

1. Download the latest release from the Chrome Web Store (when published)
2. Install directly in Chrome

## Usage

### Basic Transcription

1. **Open Side Panel**: Click the extension icon in the Chrome toolbar
2. **Select Language**: Choose your target language from the dropdown
3. **Choose Audio Source**: Select between microphone or browser tab audio
4. **Start Recording**: Click the "Start Recording" button
5. **View Transcription**: Watch as your speech is transcribed in real-time
6. **Stop Recording**: Click "Stop Recording" when finished

### Advanced Features

- **Download Transcription**: Click the download icon to save transcribed text as a file
- **Summarize Text**: Click the summarize icon to generate an AI summary
- **Settings**: Click the settings icon to access the options page
- **Language Detection**: The extension can detect and adapt to different languages

### Options Page

Access comprehensive settings through the options page:

- **Default Languages**: Set your preferred target and fallback languages
- **AI Model Selection**: Choose between different transcription models
- **Audio Source Preferences**: Configure default audio input
- **Privacy Settings**: Control data storage and retention
- **API Configuration**: Set up your preferred AI service credentials

## Permissions

The extension requires the following permissions:

- `activeTab` - Access to the current tab for tab audio capture
- `tabCapture` - Capture audio from browser tabs
- `storage` - Store settings and transcriptions locally
- `sidePanel` - Display the side panel interface

## Privacy

- All transcriptions are stored locally in your browser
- No data is sent to external servers without your explicit consent
- You can configure auto-deletion of old transcriptions
- API keys and credentials are stored securely in local storage

## Development

### Project Structure

```
src/
├── background/          # Extension background script
├── content/            # Content scripts for web pages
├── sidepanel/          # Side panel React app
├── options/            # Options page React app
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── types/              # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building

The build process creates a `dist` folder with all necessary files for the Chrome extension:

- Compiled TypeScript/React code
- Processed CSS with Tailwind
- Extension manifest
- Static assets

## API Integration

This is currently a demo version with mock transcription responses. For production use, you would need to:

1. **Set up API credentials** for your chosen transcription service
2. **Implement actual API calls** in the transcription hooks
3. **Configure rate limiting** and error handling
4. **Add authentication** for premium features

### Supported Services

- **OpenAI Whisper API** - High-quality speech recognition
- **Google Speech-to-Text** - Fast and accurate transcription
- **Azure Speech Services** - Enterprise-grade speech processing

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

ISC License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.
