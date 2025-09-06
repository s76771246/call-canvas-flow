import React, { createContext, useContext, useEffect, useState } from 'react';

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

    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { isValid: false, error: 'Token has expired' };
    }

    // Check if it's a Twilio token
    if (!payload.grants || !payload.grants.voice) {
      return { isValid: false, error: 'Token does not contain voice grants' };
    }

    return { 
      isValid: true, 
      identity: payload.grants.identity || payload.identity,
      exp: payload.exp 
    };
  } catch (error) {
    return { isValid: false, error: 'Failed to parse JWT token' };
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
  if (!context) {
    throw new Error('useTwilio must be used within a TwilioProvider');
  }
  return context;
};

interface TwilioProviderProps {
  children: React.ReactNode;
}

// Configuration
const TWILIO_CONFIG = {
  // Default phone numbers - can be updated via UI
  FROM_NUMBER: '+17408808447',
  TO_NUMBER: '+91 97592 06343',
};

// Global variables to track initialization
let twilioInitialized = false;
let twilioDevice: any = null;

export const TwilioProvider: React.FC<TwilioProviderProps> = ({ children }) => {
  const [device, setDevice] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<{ isValid: boolean; error?: string; identity?: string; exp?: number } | null>(null);
  const [currentToken, setCurrentToken] = useState<string>('');

  // Initialize ringing sound
  useEffect(() => {
    // Create ringing sound using Web Audio API
    const createRingingSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create ringing tone (440Hz and 480Hz for realistic ring)
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        return { audioContext, oscillator, gainNode };
      } catch (error) {
        console.warn('Could not create ringing sound:', error);
        return null;
      }
    };

    const ringingComponents = createRingingSound();
    if (ringingComponents) {
      // Store for cleanup
      (window as any).ringingComponents = ringingComponents;
    }

    return () => {
      if ((window as any).ringingComponents) {
        try {
          (window as any).ringingComponents.audioContext.close();
        } catch (error) {
          console.warn('Error cleaning up audio context:', error);
        }
      }
    };
  }, []);

  // Validate token function
  const validateAndSetToken = (token: string) => {
    const validation = validateJWTToken(token);
    setTokenValidation(validation);
    setCurrentToken(token);
    
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

  // Check if Twilio SDK is loaded on mount
  useEffect(() => {
    if (!(window as any).Twilio) {
      setInitializationError('Twilio SDK is not loaded. Please check your internet connection.');
    }
  }, []);

  // Play ringing sound
  const playRingingSound = () => {
    try {
      setIsRinging(true);
      
      // Create a simple ringing pattern using oscillators
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playRingTone = () => {
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create dual-tone ringing (440Hz + 480Hz)
        oscillator1.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(480, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator1.start();
        oscillator2.start();
        
        // Ring for 1 second, pause for 3 seconds
        setTimeout(() => {
          try {
            oscillator1.stop();
            oscillator2.stop();
          } catch (e) {
            console.warn('Error stopping oscillators:', e);
          }
        }, 1000);
      };
      
      // Play initial ring
      playRingTone();
      
      // Continue ringing every 4 seconds
      const ringInterval = setInterval(() => {
        if (isRinging && !isConnected) {
          playRingTone();
        } else {
          clearInterval(ringInterval);
        }
      }, 4000);
      
      // Store interval for cleanup
      (window as any).ringInterval = ringInterval;
      
    } catch (error) {
      console.warn('Could not play ringing sound:', error);
    }
  };

  // Stop ringing sound
  const stopRingingSound = () => {
    setIsRinging(false);
    if ((window as any).ringInterval) {
      clearInterval((window as any).ringInterval);
      (window as any).ringInterval = null;
    }
  };
  // Initialize Twilio Device
  const initializeTwilioDevice = async (token: string): Promise<any> => {
    if (twilioInitialized && twilioDevice) {
      console.log('✅ Twilio already initialized');
      return twilioDevice;
    }

    try {
      console.log("🔧 Initializing Twilio Device...");
      
      // Check if Twilio SDK is loaded
      if (!(window as any).Twilio) {
        throw new Error("Twilio JS SDK not loaded. Please check your internet connection.");
      }

      // Validate token
      if (!token || token.trim() === '') {
        throw new Error("Please enter a valid JWT token");
      }

      console.log("🎤 Requesting microphone permissions...");
      
      // Request microphone permissions first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone permission granted");
        // Stop the stream immediately as Twilio will handle audio
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.warn("⚠️ Microphone permission denied:", permissionError);
        throw new Error("Microphone permission is required for voice calls");
      }

      console.log('📱 Setting up Twilio Device with token...');
      
      // Clear any existing error
      setInitializationError(null);
      
      // Setup Twilio Device
      const TwilioDevice = (window as any).Twilio.Device;
      
      // Setup device with token
      TwilioDevice.setup(token, {
        debug: true, // Enable debug mode for troubleshooting
        closeProtection: false
      });
      
      // Store reference
      twilioDevice = TwilioDevice;
      
      // Setup event handlers
      TwilioDevice.ready(() => {
        console.log("✅ Twilio Device Ready - You can now make calls!");
        setIsReady(true);
        setDevice(twilioDevice);
        twilioInitialized = true;
      });

      TwilioDevice.error((error: any) => {
        console.error("❌ Twilio Device Error:", error);
        let errorMessage = `Twilio Error: ${error.message}`;
        
        switch (error.code) {
          case 31204:
            errorMessage = "JWT token is invalid or expired. Please generate a new token from Twilio Console.";
            break;
          case 31205:
            errorMessage = "JWT token signature is invalid. Check your API credentials.";
            break;
          case 31206:
            errorMessage = "JWT token is malformed. Please check the token format.";
            break;
          case 53000:
            errorMessage = "Microphone access denied. Please allow microphone access and refresh.";
            break;
          default:
            errorMessage = `Twilio Error (${error.code}): ${error.message}`;
        }
        
        setInitializationError(errorMessage);
        setIsReady(false);
      });

      TwilioDevice.connect((conn: any) => {
        console.log("📞 Call connected successfully");
        console.log("Connection details:", conn);
        stopRingingSound(); // Stop ringing when connected
        setIsConnected(true);
      });

      TwilioDevice.disconnect((conn: any) => {
        console.log("📞 Call disconnected");
        stopRingingSound(); // Stop ringing when disconnected
        setIsConnected(false);
        setIsMuted(false);
      });

      TwilioDevice.incoming((conn: any) => {
        console.log("📞 Incoming call received");
        // Auto-accept incoming calls for demo
        conn.accept();
      });

      return twilioDevice;
      
    } catch (error) {
      console.error('❌ Critical error during Twilio initialization:', error);
      setInitializationError(error.message);
      return null;
    }
  };

  const makeCall = async (phoneNumber?: string, token?: string) => {
    try {
      console.log('📞 Starting call process...');
      
      const useToken = token || currentToken;
      
      // Validate token first
      if (!useToken || useToken.trim() === '') {
        setInitializationError('Please enter a JWT token before making a call');
        return;
      }
      
      const validation = validateJWTToken(useToken);
      if (!validation.isValid) {
        setInitializationError(`Token Error: ${validation.error}`);
        return;
      }
      
      // Start ringing sound immediately
      playRingingSound();
      
      // Initialize Twilio if not already done
      const currentDevice = twilioDevice || await initializeTwilioDevice(useToken);
      
      if (!currentDevice) {
        console.error('❌ Failed to initialize Twilio device');
        stopRingingSound();
        return;
      }
      
      // Wait for device to be ready
      if (!isReady) {
        console.log('⏳ Waiting for device to be ready...');
        
        // Wait up to 5 seconds for device to be ready
        let attempts = 0;
        const maxAttempts = 10;
        
        const waitForReady = () => {
          attempts++;
          if (isReady) {
            console.log('✅ Device is ready, making call...');
            performCall(phoneNumber);
          } else if (attempts < maxAttempts) {
            console.log(`⏳ Still waiting... (${attempts}/${maxAttempts})`);
            setTimeout(waitForReady, 500);
          } else {
            console.warn('⚠️ Device not ready after 5 seconds, attempting call anyway...');
            performCall(phoneNumber);
          }
        };
        
        waitForReady();
      } else {
        performCall(phoneNumber);
      }
      
    } catch (error) {
      console.error('❌ Failed to make call:', error);
      stopRingingSound();
      setInitializationError(`Call failed: ${error.message}`);
    }
  };

  const performCall = (phoneNumber?: string) => {
    try {
      const targetNumber = phoneNumber || TWILIO_CONFIG.TO_NUMBER;
      console.log('📞 Making call to:', targetNumber);
      
      if (!targetNumber || targetNumber === '+0987654321') {
        throw new Error('Target phone number not configured');
      }
      
      // Make the actual call
      const params = {
        To: targetNumber,
        From: TWILIO_CONFIG.FROM_NUMBER
      };
      
      console.log('📞 Call parameters:', params);
      twilioDevice.connect(params);
      
    } catch (error) {
      console.error('❌ Error making call:', error);
      stopRingingSound();
      throw error;
    }
  };

  const endCall = () => {
    console.log('📞 Ending call...');
    stopRingingSound(); // Stop ringing when ending call
    try {
      if (twilioDevice && isConnected) {
        twilioDevice.disconnectAll();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
    // Always set disconnected state
    setIsConnected(false);
    setIsMuted(false);
  };

  const toggleMute = () => {
    try {
      if (twilioDevice && isConnected) {
        const connection = twilioDevice.activeConnection();
        if (connection) {
          const newMuted = !isMuted;
          connection.mute(newMuted);
          setIsMuted(newMuted);
          console.log('🔇 Mute toggled:', newMuted);
        }
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
      // Still update UI state for demo purposes
      setIsMuted(!isMuted);
    }
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

  return (
    <TwilioContext.Provider value={value}>
      {children}
    </TwilioContext.Provider>
  );
};
