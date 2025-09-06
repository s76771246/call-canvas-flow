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
  makeCall: (phoneNumber?: string) => void;
  endCall: () => void;
  toggleMute: () => void;
  initializationError: string | null;
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

// Configuration - YOU MUST UPDATE THESE VALUES
const TWILIO_CONFIG = {
  // ⚠️ IMPORTANT: Replace with your actual JWT token from Twilio Console
  // Generate a new token at: https://console.twilio.com/develop/voice/manage/access-tokens
  JWT_TOKEN: 'eyJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIiwidHlwIjoiSldUIn0.eyJqdGkiOiI0ODhlNzcwZjY4MGE3MDVhNDQyNWY0YTk5MTM0NDVjZS0xNzU3MDUyMzQ1IiwiZ3JhbnRzIjp7InZvaWNlIjp7ImluY29taW5nIjp7ImFsbG93Ijp0cnVlfSwib3V0Z29pbmciOnsiYXBwbGljYXRpb25fc2lkIjoiRUgyYzFiZGVkZjA4MDc2MzgzNmYzM2Q2MGY4MmE2Y2Q5OCJ9fSwiaWRlbnRpdHkiOiJUZXN0IENhbGxtZSJ9LCJpc3MiOiI0ODhlNzcwZjY4MGE3MDVhNDQyNWY0YTk5MTM0NDVjZSIsImV4cCI6MTc1NzA1NTk0NSwibmJmIjoxNzU3MDUyMzQ1LCJzdWIiOiJBQzYxYmU4OWY2MzMzM2I3NDg4NThmOTY3MWZlZWYyNmQ1In0.v3bmD8DyyG3BbEHn36-bVwkGYUg3q-jGjGE2q-toaOQ',
  
  // ⚠️ IMPORTANT: Replace with your actual Twilio phone number (format: +1234567890)
  FROM_NUMBER: '+17408808447',
  
  // ⚠️ IMPORTANT: Replace with the phone number you want to call (format: +1234567890)
  TO_NUMBER: '+91 97592 06343',
  
  // Optional: Token endpoint URL if you have a backend
  ACCESS_TOKEN_URL: 'https://your-backend.com/api/twilio/token',
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
  const [ringingAudio, setRingingAudio] = useState<HTMLAudioElement | null>(null);

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

  // Check configuration on mount
  useEffect(() => {
    const checkConfiguration = () => {
      // First validate the JWT token
      const validation = validateJWTToken(TWILIO_CONFIG.JWT_TOKEN);
      setTokenValidation(validation);
      
      const errors = [];
      
      if (!validation.isValid) {
        errors.push(`JWT Token Error: ${validation.error}`);
      }
      
      if (!TWILIO_CONFIG.FROM_NUMBER || TWILIO_CONFIG.FROM_NUMBER === '+1234567890') {
        errors.push('FROM_NUMBER is not configured');
      }
      
      if (!TWILIO_CONFIG.TO_NUMBER || TWILIO_CONFIG.TO_NUMBER === '+0987654321') {
        errors.push('TO_NUMBER is not configured');
      }
      
      if (!(window as any).Twilio) {
        errors.push('Twilio SDK is not loaded');
      }
      
      if (errors.length > 0) {
        const errorMessage = `🚨 Configuration Issues Found:\n\n${errors.map(e => `• ${e}`).join('\n')}\n\n${validation.isValid ? '✅ JWT Token is valid!' : '❌ Please fix JWT token first'}\n\n🎭 Demo mode will be available in 3 seconds`;
        setInitializationError(errorMessage);
        console.error('❌ Twilio Configuration Issues:', errors);
        return false;
      }
      
      return true;
    };
    
    checkConfiguration();
  }, []);

  // Set demo mode after a short delay if configuration is missing
  useEffect(() => {
    if (initializationError) {
      const timer = setTimeout(() => {
        console.log('🎭 Enabling demo mode...');
        setIsReady(true); // Enable demo mode
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [initializationError]);

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
  const initializeTwilioDevice = async (): Promise<any> => {
    if (twilioInitialized && twilioDevice) {
      console.log('✅ Twilio already initialized');
      return twilioDevice;
    }

    try {
      console.log("🔧 Initializing Twilio Device...");
      
      // Check if Twilio SDK is loaded
      if (!(window as any).Twilio) {
        throw new Error("Twilio JS SDK not loaded. Make sure the script tag is in your HTML.");
      }

      // Check configuration
      if (!TWILIO_CONFIG.JWT_TOKEN || TWILIO_CONFIG.JWT_TOKEN === 'PASTE_YOUR_GENERATED_JWT_TOKEN_HERE') {
        throw new Error("JWT Token not configured. Please update TWILIO_CONFIG.JWT_TOKEN");
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
      TwilioDevice.setup(TWILIO_CONFIG.JWT_TOKEN, {
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

  const makeCall = async (phoneNumber?: string) => {
    try {
      console.log('📞 Starting call process...');
      
      // Start ringing sound immediately
      playRingingSound();
      
      // Check if we have configuration issues
      if (initializationError) {
        console.error('❌ Cannot make call due to configuration issues:', initializationError);
        alert(`Cannot make call:\n${initializationError}\n\nPlease check the console for setup instructions.`);
        return;
      }
      
      // Initialize Twilio if not already done
      const currentDevice = twilioDevice || await initializeTwilioDevice();
      
      if (!currentDevice) {
        console.error('❌ Failed to initialize Twilio device');
        simulateCall();
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
      simulateCall();
    }
  };

  const performCall = (phoneNumber?: string) => {
    try {
      const targetNumber = phoneNumber || TWILIO_CONFIG.TO_NUMBER;
      console.log('📞 Making call to:', targetNumber);
      
      if (!targetNumber || targetNumber === '+0987654321') {
        console.warn('⚠️ Target phone number not configured, using demo mode');
        simulateCall();
        return;
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
      simulateCall();
    }
  };

  // Demo mode simulation for when Twilio is not properly configured
  const simulateCall = () => {
    console.log('🎭 Running in demo mode (no actual call will be made)...');
    
    // Play ringing sound in demo mode too
    playRingingSound();
    
    setTimeout(() => {
      console.log('📞 Demo call connected');
      stopRingingSound();
      setIsConnected(true);
    }, 3000); // Ring for 3 seconds in demo mode
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
  };

  return (
    <TwilioContext.Provider value={value}>
      {children}
    </TwilioContext.Provider>
  );
};
