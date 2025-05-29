import { useCallback, useMemo } from 'react';
import crashlytics from '@react-native-firebase/crashlytics';
import FirebaseService from '../config/firebase';

interface CrashlyticsHook {
  logMessage: (message: string) => void;
  setUserId: (userId: string) => void;
  setAttribute: (key: string, value: string) => void;
  recordError: (error: Error, jsErrorName?: string) => void;
  logEvent: (eventName: string, parameters?: Record<string, any>) => void;
  setUserProperties: (properties: Record<string, string>) => void;
}

export const useCrashlytics = (): CrashlyticsHook => {
  // Create a single instance to avoid repeated calls
  const crashlyticsInstance = useMemo(() => crashlytics(), []);

  const logMessage = useCallback((message: string) => {
    FirebaseService.logMessage(message);
  }, []);

  const setUserId = useCallback((userId: string) => {
    FirebaseService.setUserId(userId);
  }, []);

  const setAttribute = useCallback((key: string, value: string) => {
    FirebaseService.setAttribute(key, value);
  }, []);

  const recordError = useCallback((error: Error, jsErrorName?: string) => {
    FirebaseService.recordError(error, jsErrorName);
  }, []);

  const logEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    FirebaseService.logEvent(eventName, parameters);
  }, []);

  const setUserProperties = useCallback((properties: Record<string, string>) => {
    FirebaseService.setUserProperties(properties);
  }, []);

  return {
    logMessage,
    setUserId,
    setAttribute,
    recordError,
    logEvent,
    setUserProperties,
  };
}; 