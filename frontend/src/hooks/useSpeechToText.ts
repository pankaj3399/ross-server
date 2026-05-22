import { useState, useEffect, useCallback, useRef } from 'react';
import { showToast } from '../lib/toast';

/**
 * Hook for browser-native speech-to-text via the Web Speech API.
 * 
 * Key design decisions:
 * - Auto-restarts recognition when the browser kills it (silence timeout).
 * - Detects "network" error (very common in Chromium on Linux due to missing Google API keys)
 *   and instantly stops the auto-restart loop to prevent page/React crashes.
 * - Relies on SpeechRecognition's native event hooks (onstart, onend) as the source of truth for state.
 * - Uses a ref for the callback to avoid recreating the SpeechRecognition
 *   instance when parent state changes.
 * - Robust error handling and debug console logging to make troubleshooting simple.
 * 
 * @param onTranscript Called with final transcribed text to commit into the input.
 */
export function useSpeechToText(
  onTranscript: (text: string) => void
) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  // Always keep the callback ref fresh — avoids stale closures.
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Create the SpeechRecognition instance once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      console.log('SpeechToText: Web Speech API is not supported in this browser.');
      setIsSupported(false);
      return;
    }

    console.log('SpeechToText: Web Speech API is supported!');
    setIsSupported(true);

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false; // We only care about final results
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('SpeechToText: Service has started listening');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      console.log('SpeechToText: Result event received', event);
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          text += event.results[i][0].transcript;
        }
      }
      const trimmed = text.trim();
      if (trimmed) {
        console.log('SpeechToText: Final transcript text:', trimmed);
        onTranscriptRef.current(trimmed);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('SpeechToText: Error event:', event.error, event);
      
      if (event.error === 'not-allowed') {
        console.error('SpeechToText: Permission to use microphone was denied.');
        showToast.error("Microphone permission denied. Please allow microphone access in your browser settings.");
        shouldBeListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === 'network') {
        console.error('SpeechToText: Network/API key error. Chrome requires Google server connection for speech recognition.');
        showToast.error("Speech recognition failed: Network/configuration error. (Note: Chromium on Linux often lacks Google API keys. Please try official Google Chrome or check your connection).");
        shouldBeListeningRef.current = false;
        setIsListening(false);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('SpeechToText: Non-recoverable error:', event.error);
        showToast.error(`Speech recognition failed: ${event.error}`);
        shouldBeListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log('SpeechToText: Service disconnected. shouldBeListening:', shouldBeListeningRef.current);
      
      // Auto-restart if user intent is still active
      if (shouldBeListeningRef.current) {
        console.log('SpeechToText: Auto-restarting recognition session...');
        setTimeout(() => {
          if (shouldBeListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.warn('SpeechToText: Failed to auto-restart:', err);
            }
          }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      try {
        recognition.abort();
      } catch (err) {
        // ignore
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (shouldBeListeningRef.current) {
      console.log('SpeechToText: Stopping listening session (user clicked stop)');
      shouldBeListeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('SpeechToText: Error stopping:', err);
      }
      setIsListening(false);
    } else {
      console.log('SpeechToText: Starting listening session (user clicked start)');
      shouldBeListeningRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('SpeechToText: Error starting:', err);
        shouldBeListeningRef.current = false;
        setIsListening(false);
      }
    }
  }, []);

  return { isListening, isSupported, toggleListening };
}
