import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, VolumeUp, Psychology, AutoAwesome } from '@mui/icons-material';
import { Fab, Box, Typography, Chip, Backdrop, Paper } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Add type declarations for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface VoiceCommandResult {
  transcript: string;
  confidence: number;
  intent: string;
  entities: Record<string, any>;
  suggestedActions: string[];
}

interface VoiceVisualizationProps {
  isListening: boolean;
  audioLevel: number;
  voicePattern: number[];
}

/**
 * Revolutionary voice command system with advanced NLP and real-time visualization
 */
export const AdvancedVoiceInterface: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [voiceResult, setVoiceResult] = useState<VoiceCommandResult | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voicePattern, setVoicePattern] = useState<number[]>([]);
  const [showVisualization, setShowVisualization] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize speech recognition with advanced features
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let totalConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            totalConfidence = result[0].confidence;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
        setConfidence(totalConfidence);

        // Process final transcript with advanced NLP
        if (finalTranscript) {
          processVoiceCommand(finalTranscript, totalConfidence);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setShowVisualization(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setShowVisualization(false);
        stopAudioVisualization();
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioVisualization();
    };
  }, []);

  const processVoiceCommand = async (transcript: string, confidence: number) => {
    // Advanced NLP processing with intent recognition
    const result = await analyzeVoiceCommand(transcript);
    setVoiceResult(result);

    // Auto-execute high-confidence commands
    if (confidence > 0.8 && result.intent !== 'unknown') {
      executeVoiceCommand(result);
    }
  };

  const analyzeVoiceCommand = async (transcript: string): Promise<VoiceCommandResult> => {
    // Simulate advanced NLP analysis
    // In production, this would connect to your NLP service
    const intents = {
      'send message': /send|message|chat|tell/i,
      'upload file': /upload|file|attach|document/i,
      'create table': /table|create|data|columns/i,
      'search': /search|find|look for/i,
      'navigate': /go to|open|navigate/i,
      'settings': /settings|configure|options/i,
      'help': /help|assist|support/i,
    };

    let detectedIntent = 'unknown';
    let matchConfidence = 0;

    for (const [intent, pattern] of Object.entries(intents)) {
      const match = transcript.match(pattern);
      if (match) {
        detectedIntent = intent;
        matchConfidence = match.length / transcript.split(' ').length;
        break;
      }
    }

    // Extract entities (simplified)
    const entities = extractEntities(transcript);
    const suggestedActions = generateSuggestedActions(detectedIntent, entities);

    return {
      transcript,
      confidence: matchConfidence,
      intent: detectedIntent,
      entities,
      suggestedActions,
    };
  };

  const extractEntities = (transcript: string): Record<string, any> => {
    const entities: Record<string, any> = {};
    
    // Extract common entities
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\b\d{3}-\d{3}-\d{4}\b/g;
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
    const numberPattern = /\b\d+\b/g;

    entities.emails = transcript.match(emailPattern) || [];
    entities.phones = transcript.match(phonePattern) || [];
    entities.dates = transcript.match(datePattern) || [];
    entities.numbers = transcript.match(numberPattern) || [];

    return entities;
  };

  const generateSuggestedActions = (intent: string, entities: Record<string, any>): string[] => {
    const actions: Record<string, string[]> = {
      'send message': ['Send to chat', 'Save as draft', 'Add to clipboard'],
      'upload file': ['Browse files', 'Take photo', 'Record audio'],
      'create table': ['Start with template', 'Import data', 'Manual entry'],
      'search': ['Search messages', 'Search files', 'Web search'],
      'navigate': ['Go to settings', 'Open help', 'View profile'],
      'help': ['View tutorials', 'Contact support', 'FAQ'],
    };

    return actions[intent] || ['Execute command', 'Save for later', 'Cancel'];
  };

  const executeVoiceCommand = (result: VoiceCommandResult) => {
    // Execute the voice command based on intent
    switch (result.intent) {
      case 'send message':
        // Trigger message send with transcript
        console.log('Sending message:', result.transcript);
        break;
      case 'upload file':
        // Trigger file upload dialog
        console.log('Opening file upload');
        break;
      case 'search':
        // Trigger search with transcript
        console.log('Searching for:', result.transcript);
        break;
      default:
        console.log('Unknown command:', result);
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) return;

    try {
      await startAudioVisualization();
      recognitionRef.current.start();
      setIsListening(true);
      setShowVisualization(true);
      setTranscript('');
      setVoiceResult(null);
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setShowVisualization(false);
    stopAudioVisualization();
  };

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVisualization = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate audio level
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const level = sum / bufferLength / 255;
        setAudioLevel(level);

        // Update voice pattern for visualization
        const pattern = Array.from(dataArray.slice(0, 32)).map(value => value / 255);
        setVoicePattern(pattern);

        animationFrameRef.current = requestAnimationFrame(updateVisualization);
      };

      updateVisualization();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
    setVoicePattern([]);
  };

  return (
    <>
      {/* Voice Command Button */}
      <Fab
        color={isListening ? "secondary" : "primary"}
        onClick={isListening ? stopListening : startListening}
        sx={{
          position: 'fixed',
          bottom: 120,
          right: 24,
          background: isListening 
            ? 'linear-gradient(45deg, #ff4757, #ff6b7a)' 
            : 'linear-gradient(45deg, var(--quantum-primary), var(--quantum-secondary))',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: `0 0 20px ${isListening ? '#ff4757' : 'var(--quantum-primary)'}`,
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {isListening ? <MicOff /> : <Mic />}
      </Fab>

      {/* Voice Visualization Overlay */}
      <AnimatePresence>
        {showVisualization && (
          <Backdrop
            open={showVisualization}
            sx={{ zIndex: 9999, background: 'rgba(0, 0, 0, 0.8)' }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <Paper
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  minWidth: 400,
                  textAlign: 'center',
                }}
              >
                {/* Voice Pattern Visualization */}
                <VoiceVisualization
                  isListening={isListening}
                  audioLevel={audioLevel}
                  voicePattern={voicePattern}
                />

                {/* Transcript Display */}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    {transcript || 'Listening...'}
                  </Typography>
                  {confidence > 0 && (
                    <Chip
                      label={`Confidence: ${(confidence * 100).toFixed(0)}%`}
                      color={confidence > 0.7 ? 'success' : 'warning'}
                      size="small"
                    />
                  )}
                </Box>

                {/* Voice Command Result */}
                {voiceResult && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                      <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Intent: {voiceResult.intent}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {voiceResult.suggestedActions.map((action, index) => (
                        <Chip
                          key={index}
                          label={action}
                          variant="outlined"
                          size="small"
                          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2, display: 'block' }}>
                  Click the microphone button to stop listening
                </Typography>
              </Paper>
            </motion.div>
          </Backdrop>
        )}
      </AnimatePresence>
    </>
  );
};

// Voice pattern visualization component
const VoiceVisualization: React.FC<VoiceVisualizationProps> = ({
  isListening,
  audioLevel,
  voicePattern,
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
      {/* Central microphone with pulsing effect */}
      <motion.div
        animate={{
          scale: isListening ? 1 + audioLevel * 0.5 : 1,
          rotate: isListening ? [0, 5, -5, 0] : 0,
        }}
        transition={{ duration: 0.2 }}
        style={{
          background: `radial-gradient(circle, rgba(0,255,255,${audioLevel}), transparent)`,
          borderRadius: '50%',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AutoAwesome sx={{ color: 'white', fontSize: 40 }} />
      </motion.div>

      {/* Voice pattern bars */}
      <Box sx={{ display: 'flex', gap: 1, ml: 3, alignItems: 'center' }}>
        {voicePattern.map((value, index) => (
          <motion.div
            key={index}
            animate={{ height: `${20 + value * 60}px` }}
            transition={{ duration: 0.1 }}
            style={{
              width: 3,
              background: `linear-gradient(to top, var(--quantum-primary), var(--quantum-secondary))`,
              borderRadius: 1.5,
              opacity: 0.7 + value * 0.3,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
