import { DEFAULT_SETTINGS, type StorageData, type TranscriptionSettings } from '@/types'

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI Live Transcriber installed')
  
  // Initialize storage with default settings
  const existingData = await chrome.storage.local.get(['settings'])
  if (!existingData.settings) {
    const initialData: StorageData = {
      settings: DEFAULT_SETTINGS,
      transcriptions: [],
      summaries: []
    }
    await chrome.storage.local.set(initialData)
  }
})

// Handle side panel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error))

// Listen for messages from content script or side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Background received message:', message)
  
  switch (message.type) {
    case 'START_TRANSCRIPTION':
      handleStartTranscription(message.data)
      break
    case 'STOP_TRANSCRIPTION':
      handleStopTranscription()
      break
    case 'GET_SETTINGS':
      getSettings().then(sendResponse)
      return true // Keep message channel open for async response
    case 'SAVE_SETTINGS':
      saveSettings(message.data).then(sendResponse)
      return true
  }
})

async function handleStartTranscription(settings: TranscriptionSettings) {
  try {
    console.log('Starting transcription with settings:', settings)
    
    // Update settings in storage
    await chrome.storage.local.set({ settings: { ...settings, isRecording: true } })
    
    if (settings.audioSource === 'tab') {
      // Get current tab for tab capture
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab?.id) {
        throw new Error('No active tab found for audio capture')
      }
      
      // Check if tabCapture API is available
      if (!chrome.tabCapture || !chrome.tabCapture.capture) {
        throw new Error('Tab capture API is not available. Make sure the extension has tabCapture permission.')
      }
      
      // Start tab capture - using callback version for Chrome API compatibility
      chrome.tabCapture.capture({
        audio: true,
        video: false
      }, (stream) => {
        if (chrome.runtime.lastError) {
          console.error('Tab capture error:', chrome.runtime.lastError)
          chrome.runtime.sendMessage({
            type: 'TRANSCRIPTION_ERROR',
            data: { error: `Tab capture failed: ${chrome.runtime.lastError.message}` }
          })
          return
        }
        
        if (stream) {
          // Send stream info to side panel
          chrome.runtime.sendMessage({
            type: 'AUDIO_STREAM_READY',
            data: { stream }
          })
        } else {
          chrome.runtime.sendMessage({
            type: 'TRANSCRIPTION_ERROR',
            data: { error: 'Failed to capture tab audio - no stream returned' }
          })
        }
      })
    } else {
      // For microphone, we just notify the side panel to start recording
      chrome.runtime.sendMessage({
        type: 'START_MICROPHONE_RECORDING'
      })
    }
  } catch (error) {
    console.error('Error starting transcription:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_ERROR',
      data: { error: errorMessage }
    })
  }
}

async function handleStopTranscription() {
  try {
    console.log('Stopping transcription')
    
    // Update settings in storage
    const data = await chrome.storage.local.get(['settings'])
    if (data.settings) {
      await chrome.storage.local.set({
        settings: { ...data.settings, isRecording: false }
      })
    }
    
    chrome.runtime.sendMessage({
      type: 'TRANSCRIPTION_STOPPED'
    })
  } catch (error) {
    console.error('Error stopping transcription:', error)
  }
}

async function getSettings(): Promise<TranscriptionSettings> {
  const data = await chrome.storage.local.get(['settings'])
  return data.settings || DEFAULT_SETTINGS
}

async function saveSettings(settings: TranscriptionSettings): Promise<void> {
  await chrome.storage.local.set({ settings })
}

// Export for potential use in other scripts
export { handleStartTranscription, handleStopTranscription, getSettings, saveSettings }