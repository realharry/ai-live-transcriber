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

  const startRecording = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      let stream: MediaStream

      if (audioSource === 'microphone') {
        // Request microphone access
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000
          }
        })
      } else {
        // For tab audio, we need to use Chrome's tabCapture API
        // This will be handled by the background script
        chrome.runtime.sendMessage({
          type: 'START_TRANSCRIPTION',
          data: { audioSource, language }
        })
        
        setIsLoading(false)
        
        return new Promise<void>((resolve, reject) => {
          const messageListener = (message: any) => {
            if (message.type === 'AUDIO_STREAM_READY') {
              if (message.data.stream) {
                setupMediaRecorder(message.data.stream)
                resolve()
              } else {
                reject(new Error('No stream received from background script'))
              }
              chrome.runtime.onMessage.removeListener(messageListener)
            } else if (message.type === 'TRANSCRIPTION_ERROR') {
              reject(new Error(message.data.error))
              chrome.runtime.onMessage.removeListener(messageListener)
            }
          }
          chrome.runtime.onMessage.addListener(messageListener)
          
          // Timeout after 10 seconds
          setTimeout(() => {
            chrome.runtime.onMessage.removeListener(messageListener)
            reject(new Error('Timeout waiting for tab capture'))
          }, 10000)
        })
      }

      setupMediaRecorder(stream)
      
    } catch (err) {
      console.error('Error starting recording:', err)
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    } finally {
      setIsLoading(false)
    }
  }, [audioSource, language])

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
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'STOP_TRANSCRIPTION'
      })
    }
  }, [isRecording])

  const simulateTranscription = async (_audioBlob: Blob): Promise<void> => {
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
  }

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