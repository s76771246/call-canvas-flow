import React, { createContext, useContext, useEffect, useState } from 'react';

// Declare Twilio global variable for TypeScript
declare global {
  interface Window {
    Twilio: any;
  }
}

// Token validation utility
const validateJWTToken = (token: string): { isValid: boolean; error?: string; identity?: string; exp?: number } => {
  try {
    if (!token || token.trim() === '') {
      return { isValid: false, error: 'Token is empty' };
    }

    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid JWT format - should have 3 parts separated by dots' };
    }

    // Decode payload with proper base64 padding
    let payload;
    try {
      // Add padding if needed
      let base64 = parts[1];
      while (base64.length % 4) {
        base64 += '=';
      }
      payload = JSON.parse(atob(base64));
    } catch (decodeError) {
      return { isValid: false, error: 'Failed to decode JWT payload' };
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { isValid: false, error: 'Token has expired' };
    }

    // Check if it's a Twilio token (more flexible check)
    if (!payload.grants) {
      return { isValid: false, error: 'Token does not contain grants' };
    }

    return { 
      isValid: true, 
      identity: payload.sub || payload.identity || 'Unknown',
      exp: payload.exp 
    };
  } catch (error) {
    return { isValid: false, error: `Failed to parse JWT token: ${error.message}` };
  }
};

interface TwilioContextType {
  device: any | null;
  isReady: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isRinging: boolean;
  tokenValidation: { isValid: boolean; error?: string; identity?: string; exp?: number } | null;
  makeCall: (phoneNumber?: string, token?: string) => void;
  endCall: () => void;
  toggleMute: () => void;
  initializationError: string | null;
  validateAndSetToken: (token: string) => void;
  clearError: () => void;
}

const TwilioContext = createContext<TwilioContextType | undefined>(undefined);

export const useTwilio = () => {
  const context = useContext(TwilioContext);
  if (context === undefined) {
    throw new Error('useTwilio must be used within a TwilioProvider');
  }
  return context;
};

interface TwilioProviderProps {
  children: React.ReactNode;
}

export const TwilioProvider: React.FC<TwilioProviderProps> = ({ children }) => {
  const [device, setDevice] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<{ isValid: boolean; error?: string; identity?: string; exp?: number } | null>(null);
  const [currentConnection, setCurrentConnection] = useState<any | null>(null);
  const [ringingSound, setRingingSound] = useState<HTMLAudioElement | null>(null);

  // Initialize ringing sound
  useEffect(() => {
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAD2S0evPficEJnzK8N6OPw';
    audio.loop = true;
    setRingingSound(audio);
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  // Check if Twilio SDK is available
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Twilio) {
      setInitializationError('Twilio SDK not loaded. Please check your internet connection or script loading.');
    }
  }, []);

  const initializeTwilioDevice = async (token: string) => {
    try {
      if (!window.Twilio) {
        throw new Error('Twilio SDK is not available');
      }

      console.log('Initializing Twilio Device...');
      
      // Request microphone permissions
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone permission granted');
      } catch (permError) {
        console.warn('Microphone permission denied:', permError);
        setInitializationError('Microphone access is required for voice calls. Please grant permission.');
        return;
      }

      const newDevice = new window.Twilio.Device(token, {
        debug: true,
        logLevel: 'debug'
      });

      newDevice.on('ready', () => {
        console.log('Twilio Device is ready');
        setIsReady(true);
        setInitializationError(null);
      });

      newDevice.on('error', (error: any) => {
        console.error('Twilio Device error:', error);
        setInitializationError(`Device Error: ${error.message}`);
        setIsReady(false);
      });

      newDevice.on('connect', (connection: any) => {
        console.log('Call connected');
        setCurrentConnection(connection);
        setIsConnected(true);
        setIsRinging(false);
        if (ringingSound) {
          ringingSound.pause();
        }
      });

      newDevice.on('disconnect', () => {
        console.log('Call disconnected');
        setCurrentConnection(null);
        setIsConnected(false);
        setIsRinging(false);
        setIsMuted(false);
        if (ringingSound) {
          ringingSound.pause();
        }
      });

      setDevice(newDevice);
    } catch (error: any) {
      console.error('Failed to initialize Twilio Device:', error);
      setInitializationError(`Initialization Error: ${error.message}`);
      setIsReady(false);
    }
  };

  const makeCall = async (phoneNumber?: string, token?: string) => {
    try {
      const callToken = token || '';
      const callNumber = phoneNumber || '';

      if (!callToken.trim()) {
        setInitializationError('Token is required to make a call');
        return;
      }

      if (!callNumber.trim()) {
        setInitializationError('Phone number is required');
        return;
      }

      // Validate token
      const isValid = validateAndSetToken(callToken);
      if (!isValid) {
        return;
      }

      // Initialize device if not ready
      if (!device || !isReady) {
        await initializeTwilioDevice(callToken);
        // Wait a bit for device to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!device || !isReady) {
        setInitializationError('Device not ready. Please try again.');
        return;
      }

      console.log('Making call to:', callNumber);
      setIsRinging(true);
      
      // Start ringing sound
      if (ringingSound) {
        try {
          await ringingSound.play();
        } catch (audioError) {
          console.warn('Could not play ringing sound:', audioError);
        }
      }

      const connection = await device.connect({
        To: callNumber
      });

      setCurrentConnection(connection);
    } catch (error: any) {
      console.error('Failed to make call:', error);
      setInitializationError(`Call Error: ${error.message}`);
      setIsRinging(false);
      if (ringingSound) {
        ringingSound.pause();
      }
    }
  };

  const endCall = () => {
    try {
      if (currentConnection) {
        currentConnection.disconnect();
      }
      if (device && device.activeConnection) {
        device.activeConnection.disconnect();
      }
      setCurrentConnection(null);
      setIsConnected(false);
      setIsRinging(false);
      setIsMuted(false);
      if (ringingSound) {
        ringingSound.pause();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const toggleMute = () => {
    try {
      if (currentConnection) {
        if (isMuted) {
          currentConnection.mute(false);
        } else {
          currentConnection.mute(true);
        }
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const validateAndSetToken = (token: string) => {
    const validation = validateJWTToken(token);
    setTokenValidation(validation);
    
    if (!validation.isValid) {
      setInitializationError(`Token Error: ${validation.error}`);
    } else {
      setInitializationError(null);
    }
    
    return validation.isValid;
  };

  const clearError = () => {
    setInitializationError(null);
  };

  const value: TwilioContextType = {
    device,
    isReady,
    isConnected,
    isMuted,
    isRinging,
    tokenValidation,
    makeCall,
    endCall,
    toggleMute,
    initializationError,
    validateAndSetToken,
    clearError,
  };

  console.log('TwilioProvider value:', value);

  return (
    <TwilioContext.Provider value={value}>
      {children}
    </TwilioContext.Provider>
  );
};