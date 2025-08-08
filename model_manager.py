import os
import logging
from typing import Dict, Any
from livekit.plugins import openai, deepgram, cartesia, elevenlabs, groq, sarvam, assemblyai, fal, playht

logger = logging.getLogger("model-manager")

class ModelManager:
    def __init__(self):
        self.supported_providers = {
            'llm': {
                'openai': self._create_openai_llm,
                'groq': self._create_groq_llm,
            },
            'stt': {
                'openai': self._create_openai_stt,
                'deepgram': self._create_deepgram_stt,
                'assemblyai': self._create_assemblyai_stt,
                'cartesia': self._create_cartesia_stt,
                'groq': self._create_groq_stt,
                'fal': self._create_fal_stt,
                'sarvam': self._create_sarvam_stt,
            },
            'tts': {
                'openai': self._create_openai_tts,
                'elevenlabs': self._create_elevenlabs_tts,
                'cartesia': self._create_cartesia_tts,
                'deepgram': self._create_deepgram_tts,
                'groq': self._create_groq_tts,
                'playht': self._create_playht_tts,
                'sarvam': self._create_sarvam_tts,
            }
        }

    def create_models_from_request(self, request_data: Dict) -> Dict[str, Any]:
        """Create LLM, STT, and TTS models from request data"""
        attributes = request_data.get('attributes', {})
        api_keys = {
            'llm': request_data.get('llmApiKey'),
            'stt': request_data.get('sttApiKey'),
            'tts': request_data.get('ttsApiKey'),
        }

        models = {}
        
        # Create LLM model
        llm_provider = attributes.get('llm_provider', 'openai')
        llm_model_id = attributes.get('llm_model_id', 'gpt-4o-mini')
        models['llm'] = self._create_model('llm', llm_provider, llm_model_id, api_keys['llm'])

        # Create STT model
        stt_provider = attributes.get('stt_provider', 'openai')
        stt_model_id = attributes.get('stt_model_id', 'whisper-1')
        models['stt'] = self._create_model('stt', stt_provider, stt_model_id, api_keys['stt'])

        # Create TTS model
        tts_provider = attributes.get('tts_provider', 'openai')
        tts_model_id = attributes.get('tts_model_id', 'tts-1')
        models['tts'] = self._create_model('tts', tts_provider, tts_model_id, api_keys['tts'])

        return models

    def _create_model(self, model_type: str, provider: str, model_id: str, api_key: str = None):
        """Create a specific model based on type, provider, and model ID"""
        if model_type not in self.supported_providers:
            raise ValueError(f"Unsupported model type: {model_type}")
        
        if provider not in self.supported_providers[model_type]:
            raise ValueError(f"Unsupported {model_type} provider: {provider}")

        creator_func = self.supported_providers[model_type][provider]
        return creator_func(model_id, api_key)

    # LLM Models
    def _create_openai_llm(self, model_id: str, api_key: str = None):
        return openai.LLM(
            model=model_id,
            api_key=api_key or os.getenv("OPENAI_API_KEY")
        )

    def _create_groq_llm(self, model_id: str, api_key: str = None):
        return groq.LLM(
            model=model_id,
            api_key=api_key or os.getenv("GROQ_API_KEY")
        )

    # STT Models
    def _create_openai_stt(self, model_id: str, api_key: str = None):
        return openai.STT(
            model=model_id,
            api_key=api_key or os.getenv("OPENAI_API_KEY")
        )

    def _create_deepgram_stt(self, model_id: str, api_key: str = None):
        return deepgram.STT(
            model=model_id,
            api_key=api_key or os.getenv("DEEPGRAM_API_KEY")
        )

    def _create_assemblyai_stt(self, model_id: str, api_key: str = None):
        return assemblyai.STT(
            model=model_id,
            api_key=api_key or os.getenv("ASSEMBLYAI_API_KEY")
        )

    def _create_cartesia_stt(self, model_id: str, api_key: str = None):
        return cartesia.STT(
            model=model_id,
            api_key=api_key or os.getenv("CARTESIA_API_KEY")
        )

    def _create_groq_stt(self, model_id: str, api_key: str = None):
        return groq.STT(
            model=model_id,
            api_key=api_key or os.getenv("GROQ_API_KEY")
        )

    def _create_fal_stt(self, model_id: str, api_key: str = None):
        return fal.STT(
            model=model_id,
            api_key=api_key or os.getenv("FAL_API_KEY")
        )

    def _create_sarvam_stt(self, model_id: str, api_key: str = None):
        return sarvam.STT(
            model=model_id,
            api_key=api_key or os.getenv("SARVAM_API_KEY")
        )

    # TTS Models
    def _create_openai_tts(self, model_id: str, api_key: str = None):
        return openai.TTS(
            model=model_id,
            api_key=api_key or os.getenv("OPENAI_API_KEY")
        )

    def _create_elevenlabs_tts(self, model_id: str, api_key: str = None):
        return elevenlabs.TTS(
            model=model_id,
            api_key=api_key or os.getenv("ELEVENLABS_API_KEY")
        )

    def _create_cartesia_tts(self, model_id: str, api_key: str = None):
        return cartesia.TTS(
            model=model_id,
            api_key=api_key or os.getenv("CARTESIA_API_KEY")
        )

    def _create_deepgram_tts(self, model_id: str, api_key: str = None):
        return deepgram.TTS(
            model=model_id,
            api_key=api_key or os.getenv("DEEPGRAM_API_KEY")
        )

    def _create_groq_tts(self, model_id: str, api_key: str = None):
        return groq.TTS(
            model=model_id,
            api_key=api_key or os.getenv("GROQ_API_KEY")
        )

    def _create_playht_tts(self, model_id: str, api_key: str = None):
        return playht.TTS(
            model=model_id,
            api_key=api_key or os.getenv("PLAYHT_API_KEY")
        )

    def _create_sarvam_tts(self, model_id: str, api_key: str = None):
        return sarvam.TTS(
            model=model_id,
            api_key=api_key or os.getenv("SARVAM_API_KEY")
        )