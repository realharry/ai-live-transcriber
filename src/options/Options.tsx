import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { 
  TranscriptionSettings, 
  SUPPORTED_LANGUAGES,
  SUPPORTED_MODELS,
  DEFAULT_SETTINGS 
} from '@/types'
import { Save, Check } from 'lucide-react'

export function Options() {
  const [settings, setSettings] = useState<TranscriptionSettings>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await chrome.storage.local.get(['settings'])
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      await chrome.storage.local.set({ settings })
      setSaveSuccess(true)
      
      // Hide success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingChange = (key: keyof TranscriptionSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">AI Live Transcriber Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your transcription preferences and AI model settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Language Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Target Language</label>
              <Select
                value={settings.targetLanguage}
                onChange={(e) => handleSettingChange('targetLanguage', e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500">
                This will be the default language for new transcription sessions.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fallback Language</label>
              <Select
                value={settings.defaultLanguage}
                onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500">
                Used when target language detection fails.
              </p>
            </div>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">AI Model Settings</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Transcription Model</label>
            <Select
              value={settings.llmModel}
              onChange={(e) => handleSettingChange('llmModel', e.target.value)}
            >
              {SUPPORTED_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-gray-500">
              Choose the AI model for transcription and summarization.
            </p>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Audio Settings</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Audio Source</label>
            <Select
              value={settings.audioSource}
              onChange={(e) => handleSettingChange('audioSource', e.target.value as 'microphone' | 'tab')}
            >
              <option value="microphone">Microphone</option>
              <option value="tab">Browser Tab Audio</option>
            </Select>
            <p className="text-xs text-gray-500">
              Choose the default audio input source for transcription.
            </p>
          </div>
        </div>

        {/* API Configuration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">API Configuration</h2>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This demo version uses mock transcription responses. 
              In a production version, you would configure your API keys for services like 
              OpenAI Whisper, Google Speech-to-Text, or Azure Speech Services here.
            </p>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Privacy & Storage</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input 
                type="checkbox" 
                id="store-transcriptions" 
                className="mt-1"
                defaultChecked 
              />
              <div>
                <label htmlFor="store-transcriptions" className="text-sm font-medium">
                  Store transcriptions locally
                </label>
                <p className="text-xs text-gray-500">
                  Keep transcriptions in browser storage for history and review.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input 
                type="checkbox" 
                id="auto-delete" 
                className="mt-1"
              />
              <div>
                <label htmlFor="auto-delete" className="text-sm font-medium">
                  Auto-delete after 30 days
                </label>
                <p className="text-xs text-gray-500">
                  Automatically remove old transcriptions to save space.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Settings saved!</span>
            </>
          )}
        </div>
        
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}