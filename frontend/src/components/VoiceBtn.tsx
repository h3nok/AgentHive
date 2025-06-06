import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Tooltip, useTheme, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

interface VoiceBtnProps {
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
  onTranscript: (transcript: string, isFinal: boolean) => void;
}

const VoiceBtn: React.FC<VoiceBtnProps> = ({
  isRecording,
  onRecordingChange,
  onTranscript,
}) => {
  const theme = useTheme();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      const isFinal = event.results[current].isFinal;
      
      onTranscript(transcript, isFinal);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onRecordingChange(false);
    };

    recognition.onend = () => {
      onRecordingChange(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onRecordingChange]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      onRecordingChange(false);
    } else {
      recognitionRef.current.start();
      onRecordingChange(true);
    }
  };

  return (
    <Tooltip title={isRecording ? "Stop recording" : "Start voice input"}>
      <IconButton
        onClick={toggleRecording}
        size="small"
        sx={{
          position: 'relative',
          color: isRecording ? '#c8102e' : theme.palette.text.secondary,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        {/* Pulsing ring animation when recording */}
        <AnimatePresence>
          {isRecording && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: '#c8102e',
                }}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5,
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: '#c8102e',
                }}
              />
            </>
          )}
        </AnimatePresence>
        
        {isRecording ? <MicIcon /> : <MicOffIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default VoiceBtn; 