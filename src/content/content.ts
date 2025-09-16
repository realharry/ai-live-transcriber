// Content script for AI Live Transcriber
console.log('AI Live Transcriber content script loaded')

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  console.log('Content script received message:', message)
  
  switch (message.type) {
    case 'GET_PAGE_AUDIO':
      handleGetPageAudio()
      break
    case 'INJECT_AUDIO_CAPTURE':
      injectAudioCapture()
      break
  }
})

function handleGetPageAudio() {
  // This function could be used to detect audio elements on the page
  const audioElements = document.querySelectorAll('audio, video')
  const audioSources = Array.from(audioElements).map(element => {
    const mediaElement = element as HTMLMediaElement
    return {
      src: mediaElement.src,
      type: element.tagName.toLowerCase(),
      playing: !mediaElement.paused
    }
  })
  
  chrome.runtime.sendMessage({
    type: 'PAGE_AUDIO_INFO',
    data: { audioSources }
  })
}

function injectAudioCapture() {
  // This function could be used to inject audio capture capabilities
  // For now, we'll just notify that injection is complete
  chrome.runtime.sendMessage({
    type: 'AUDIO_CAPTURE_INJECTED',
    data: { success: true }
  })
}

// Monitor page for audio changes
let audioChangeTimer: number | null = null

function monitorAudioChanges() {
  const audioElements = document.querySelectorAll('audio, video')
  
  audioElements.forEach(element => {
    if (!element.hasAttribute('data-transcriber-monitored')) {
      element.setAttribute('data-transcriber-monitored', 'true')
      
      const mediaElement = element as HTMLMediaElement
      
      element.addEventListener('play', () => {
        chrome.runtime.sendMessage({
          type: 'AUDIO_STARTED',
          data: { src: mediaElement.src, type: element.tagName.toLowerCase() }
        })
      })
      
      element.addEventListener('pause', () => {
        chrome.runtime.sendMessage({
          type: 'AUDIO_STOPPED',
          data: { src: mediaElement.src, type: element.tagName.toLowerCase() }
        })
      })
    }
  })
}

// Initial monitor setup
monitorAudioChanges()

// Monitor for new audio elements added dynamically
const observer = new MutationObserver(() => {
  if (audioChangeTimer) {
    clearTimeout(audioChangeTimer)
  }
  
  audioChangeTimer = window.setTimeout(() => {
    monitorAudioChanges()
    audioChangeTimer = null
  }, 500)
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})