import React, { createContext, useContext, useEffect, useState } from 'react';

interface TwilioContextType {
  device: any | null;
  isReady: boolean;
  isConnected: boolean;
  isMuted: boolean;
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

  // Check configuration on mount
  useEffect(() => {
    const checkConfiguration = () => {
      const errors = [];
      
      if (!TWILIO_CONFIG.JWT_TOKEN || TWILIO_CONFIG.JWT_TOKEN === 'eyJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIiwidHlwIjoiSldUIn0.eyJqdGkiOiI0ODhlNzcwZjY4MGE3MDVhNDQyNWY0YTk5MTM0NDVjZS0xNzU3MDUyMzQ1IiwiZ3JhbnRzIjp7InZvaWNlIjp7ImluY29taW5nIjp7ImFsbG93Ijp0cnVlfSwib3V0Z29pbmciOnsiYXBwbGljYXRpb25fc2lkIjoiRUgyYzFiZGVkZjA4MDc2MzgzNmYzM2Q2MGY4MmE2Y2Q5OCJ9fSwiaWRlbnRpdHkiOiJUZXN0IENhbGxtZSJ9LCJpc3MiOiI0ODhlNzcwZjY4MGE3MDVhNDQyNWY0YTk5MTM0NDVjZSIsImV4cCI6MTc1NzA1NTk0NSwibmJmIjoxNzU3MDUyMzQ1LCJzdWIiOiJBQzYxYmU4OWY2MzMzM2I3NDg4NThmOTY3MWZlZWYyNmQ1In0.v3bmD8DyyG3BbEHn36-bVwkGYUg3q-jGjGE2q-toaOQ') {
        errors.push('JWT Token is not configured');
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
        const errorMessage = `🚨 CARA Setup Required\n\nTo make live calls, you need to:\n\n1. Get a Twilio Account:\n   • Sign up at twilio.com\n   • Purchase a phone number\n   • Get your credentials\n\n2. Generate JWT Token:\n   • Go to Twilio Console > Voice > Access Tokens\n   • Create a new token with identity "TestUser"\n   • Copy the JWT token\n\n3. Update Configuration:\n   • Replace JWT_TOKEN in TwilioProvider.tsx\n   • Set your Twilio phone number\n   • Set target phone number\n\n📖 See CARA_SETUP.md for detailed instructions\n\n⚠️ Current issues:\n${errors.map(e => `• ${e}`).join('\n')}\n\n🎭 Demo mode available - click "Demo Call" to test UI`;
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
        setIsReady(true); // Enable demo mode
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [initializationError]);

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
        setIsConnected(true);
      });

      TwilioDevice.disconnect((conn: any) => {
        console.log("📞 Call disconnected");
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
    console.log('💡 To make real calls, please:');
    console.log('1. Generate a JWT token from Twilio Console');
    console.log('2. Update TWILIO_CONFIG.JWT_TOKEN in TwilioProvider.tsx');
    console.log('3. Set your Twilio phone number in TWILIO_CONFIG.FROM_NUMBER');
    console.log('4. Set target phone number in TWILIO_CONFIG.TO_NUMBER');
    
    setTimeout(() => {
      console.log('📞 Demo call connected');
      setIsConnected(true);
    }, 2000);
  };

  const endCall = () => {
    console.log('📞 Ending call...');
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
