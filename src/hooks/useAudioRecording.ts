import { useState, useCallback, useRef, useEffect } from 'react'
import { TranscriptionData } from '@/types'

interface UseAudioRecordingProps {
  onTranscription?: (transcription: TranscriptionData) => void
  language?: string
  audioSource?: 'microphone' | 'tab'
}

export function useAudioRecording({
  onTranscription,
  language = 'en',
  audioSource = 'microphone'
}: UseAudioRecordingProps = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const simulateTranscription = useCallback(async (_audioBlob: Blob): Promise<void> => {
    // This is a mock function - in a real implementation, you would:
    // 1. Convert the audio blob to the format expected by your AI service
    // 2. Send it to the transcription API (OpenAI Whisper, Google Speech-to-Text, etc.)
    // 3. Process the response
    
    setIsLoading(true)
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock transcription result
      const mockTranscription: TranscriptionData = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        text: "This is a mock transcription. In a real implementation, this would be the actual transcribed text from your audio.",
        language: language,
        confidence: 0.95
      }
      
      onTranscription?.(mockTranscription)
    } catch (err) {
      console.error('Transcription error:', err)
      setError('Failed to transcribe audio')
    } finally {
      setIsLoading(false)
    }
  }, [language, onTranscription])

  const setupMediaRecorder = useCallback((stream: MediaStream) => {
    streamRef.current = stream
    audioChunksRef.current = []

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      // Here you would typically send the audio to a transcription service
      // For now, we'll simulate a transcription response
      await simulateTranscription(audioBlob)
      
      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000) // Capture data every second
    setIsRecording(true)
  }, [simulateTranscription])

  const startRecording = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Starting recording with audio source:', audioSource)
      
      if (audioSource === 'tab') {
        // For tab audio, we'll try to use the background script approach
        console.log('Requesting tab audio capture...')
        
        try {
          // Request tab capture through background script
          const response = await chrome.runtime.sendMessage({
            type: 'START_TAB_CAPTURE'
          })
          
          if (response.error) {
            throw new Error(response.error)
          }
          
          // The background script will handle tab capture and send us the stream
          setIsLoading(false)
          
        } catch (tabError: any) {
          console.warn('Tab capture failed, falling back to microphone:', tabError)
          setError('Tab capture failed. Using microphone instead for better reliability.')
          
          // Fallback to microphone
          const stream = await getMicrophoneStream()
          setupMediaRecorder(stream)
          setIsLoading(false)
        }
      } else {
        // Always use microphone for now to avoid Chrome API complications
        console.log('Starting microphone recording...')
        const stream = await getMicrophoneStream()
        setupMediaRecorder(stream)
        setIsLoading(false)
      }
      
    } catch (err: any) {
      console.error('Error starting recording:', err)
      let errorMessage = 'Failed to start recording'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access when prompted by your browser.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please check your audio devices.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Microphone constraints could not be satisfied.'
      } else if (err.message?.includes('permission')) {
        errorMessage = 'Microphone permission denied. Please allow microphone access when prompted by your browser.'
      }
      
      setError(errorMessage)
      setIsLoading(false)
    }
  }, [audioSource, setupMediaRecorder])

  const getMicrophoneStream = useCallback(async (): Promise<MediaStream> => {
    try {
      console.log('Requesting microphone access...')
      
      // First, check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser')
      }
      
      // Try with simple constraints first (more likely to work in Chrome extensions)
      try {
        console.log('Attempting getUserMedia with simple constraints...')
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        })
        
        console.log('Microphone access granted, stream:', stream)
        console.log('Audio tracks:', stream.getAudioTracks().map(track => ({ 
          id: track.id, 
          label: track.label, 
          enabled: track.enabled, 
          readyState: track.readyState 
        })))
        
        return stream
        
      } catch (simpleError: any) {
        console.warn('Simple constraints failed, trying optimal constraints:', simpleError)
        
        // Try with optimal constraints as fallback
        try {
          const optimalStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: { ideal: 16000 },
              sampleSize: { ideal: 16 },
              channelCount: { ideal: 1 }
            }
          })
          
          console.log('Microphone access granted with optimal constraints')
          return optimalStream
          
        } catch (optimalError: any) {
          console.warn('Both constraint attempts failed, throwing original error')
          throw simpleError // Throw the original simple error
        }
      }
      
    } catch (error: any) {
      console.error('Microphone access error:', error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      
      // Enhanced error handling with specific user guidance
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied. Please click "Allow" when your browser prompts for microphone access. If you already denied it, click the lock icon in your browser\'s address bar to enable microphone access.')
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone to your computer and try again.')
      } else if (error.name === 'NotReadableError') {
        throw new Error('Microphone is being used by another application. Please close other apps that might be using the microphone and try again.')
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Microphone constraints could not be satisfied. This usually indicates a hardware issue.')
      } else if (error.name === 'SecurityError') {
        throw new Error('Microphone access blocked by security policy. Please check your browser security settings.')
      } else if (error.message?.toLowerCase().includes('permission')) {
        throw new Error('Microphone permission issue. Please allow microphone access in your browser and try again.')
      } else {
        throw new Error(`Microphone access failed: ${error.message || 'Unknown error'}. Please check your microphone settings and try again.`)
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'STOP_TRANSCRIPTION'
      }).catch(err => console.warn('Failed to notify background:', err))
    }
  }, [isRecording])

  // Listen for messages from background script
  useEffect(() => {
    const messageListener = (message: any) => {
      console.log('useAudioRecording received message:', message)
      
      switch (message.type) {
        case 'TRANSCRIPTION_ERROR':
          setError(message.data.error)
          setIsLoading(false)
          setIsRecording(false)
          break
        case 'AUDIO_STREAM_READY':
          // Handle tab capture stream
          if (message.data.stream) {
            setupMediaRecorder(message.data.stream)
            setIsLoading(false)
          }
          break
        case 'START_MICROPHONE_RECORDING':
          // Background script is telling us to start microphone recording
          getMicrophoneStream()
            .then(setupMediaRecorder)
            .then(() => setIsLoading(false))
            .catch((err) => {
              setError(err.message)
              setIsLoading(false)
            })
          break
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)
    
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [setupMediaRecorder, getMicrophoneStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording])

  return {
    isRecording,
    isLoading,
    error,
    startRecording,
    stopRecording
  }
}