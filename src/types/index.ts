export interface TranscriptionSettings {
  targetLanguage: string
  defaultLanguage: string
  llmModel: string
  isRecording: boolean
  audioSource: 'microphone' | 'tab'
}

export interface TranscriptionData {
  id: string
  timestamp: Date
  text: string
  language: string
  confidence?: number
}

export interface SummaryData {
  id: string
  originalTranscriptionId: string
  summary: string
  timestamp: Date
}

export interface StorageData {
  settings: TranscriptionSettings
  transcriptions: TranscriptionData[]
  summaries: SummaryData[]
}

export const DEFAULT_SETTINGS: TranscriptionSettings = {
  targetLanguage: 'en',
  defaultLanguage: 'en',
  llmModel: 'whisper',
  isRecording: false,
  audioSource: 'microphone'
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
]

export const SUPPORTED_MODELS = [
  { id: 'whisper', name: 'OpenAI Whisper' },
  { id: 'google', name: 'Google Speech-to-Text' },
  { id: 'azure', name: 'Azure Speech Services' },
]