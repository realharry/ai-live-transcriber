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
      
      // Always use microphone for now to avoid Chrome API complications
      console.log('Starting microphone recording...')
      
      if (audioSource === 'tab') {
        console.warn('Tab audio requested but using microphone for reliability')
        setError('Using microphone instead of tab audio for better reliability')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })
      setupMediaRecorder(stream)
      setIsLoading(false)
      
    } catch (err: any) {
      console.error('Error starting recording:', err)
      let errorMessage = 'Failed to start recording'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please check your audio devices.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Microphone constraints could not be satisfied.'
      }
      
      setError(errorMessage)
      setIsLoading(false)
    }
  }, [audioSource, language, setupMediaRecorder])

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