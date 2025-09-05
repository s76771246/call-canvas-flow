import React, { createContext, useContext, useEffect, useState } from 'react';

interface TwilioContextType {
  device: any | null;
  isReady: boolean;
  isConnected: boolean;
  isMuted: boolean;
  makeCall: (phoneNumber?: string) => void;
  endCall: () => void;
  toggleMute: () => void;
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

// Configuration - Replace with your actual JWT token and phone numbers
const TWILIO_CONFIG = {
  // PASTE YOUR GENERATED JWT TOKEN HERE
  JWT_TOKEN: 'eyJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIiwidHlwIjoiSldUIn0.eyJqdGkiOiI0ODhlNzcwZjY4MGE3MDVhNDQyNWY0YTk5MTM0NDVjZS0xNzU3MDQ5NjQyIiwiZ3JhbnRzIjp7InZvaWNlIjp7ImluY29taW5nIjp7ImFsbG93Ijp0cnVlfSwib3V0Z29pbmciOnsiYXBwbGljYXRpb25fc2lkIjoiRUgyYzFiZGVkZjA4MDc2MzgzNmYzM2Q2MGY4MmE2Y2Q5OCJ9fSwiaWRlbnRpdHkiOiJUZXN0IENhbGxtZSJ9LCJpc3MiOiI0ODhlNzcwZjY4MGE3MDVhNDQyNWY0YTk5MTM0NDVjZSIsImV4cCI6MTc1NzA1MzI0MiwibmJmIjoxNzU3MDQ5NjQyLCJzdWIiOiJBQzYxYmU4OWY2MzMzM2I3NDg4NThmOTY3MWZlZWYyNmQ1In0.blklh8i2SlzEDebIFMAow0Rpnp3Zi80mz1FtRERwGCc',
  
  // Replace these with your actual phone numbers
  FROM_NUMBER: '+1234567890', // Replace with your Twilio phone number
  TO_NUMBER: '+0987654321',   // Replace with target phone number
};

export const TwilioProvider: React.FC<TwilioProviderProps> = ({ children }) => {
  const [device, setDevice] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Only initialize once
    if (!isInitializing && !device) {
      setIsInitializing(true);
      initializeDevice();
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (device && (window as any).Twilio?.Device) {
        try {
          (window as any).Twilio.Device.disconnectAll();
        } catch (error) {
          console.warn('Error during cleanup:', error);
        }
      }
    };
  }, [device]);

  const initializeDevice = async () => {
    try {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if Twilio SDK is loaded
      if (!(window as any).Twilio) {
        console.error("Twilio JS SDK not loaded");
        setIsInitializing(false);
        return;
      }

      const token = TWILIO_CONFIG.JWT_TOKEN;
      
      // Check if token is provided
      if (!token || token === 'PASTE_YOUR_GENERATED_JWT_TOKEN_HERE') {
        console.warn('Please provide a valid JWT token in TWILIO_CONFIG');
        setIsInitializing(false);
        return;
      }

      console.log("🔧 Initializing Twilio Device with token...");

      // Request microphone permissions first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("🎤 Microphone permission granted");
        // Stop the stream immediately, we just needed permission
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.warn("⚠️ Microphone permission denied:", permissionError);
        // Continue anyway, Twilio might still work
      }

      // Use legacy setup method which is most compatible
      console.log('📱 Setting up Twilio Device...');
      
      // Setup device with token
      (window as any).Twilio.Device.setup(token, {
        debug: false,
        enableAudio: true
      });
      
      // Store reference to device
      setDevice((window as any).Twilio.Device);
      
      // Setup event handlers
      (window as any).Twilio.Device.ready(() => {
        console.log("✅ Twilio Device Ready - calls can now be made");
        setIsReady(true);
        setIsInitializing(false);
      });

      (window as any).Twilio.Device.error((error: any) => {
        console.error("❌ Twilio Device Error:", error);
        setIsInitializing(false);
        if (error.code === 31204) {
          console.error("JWT token is invalid or expired. Please generate a new token.");
        }
      });

      (window as any).Twilio.Device.connect((conn: any) => {
        console.log("📞 Call connected");
        setIsConnected(true);
      });

      (window as any).Twilio.Device.disconnect((conn: any) => {
        console.log("📞 Call disconnected");
        setIsConnected(false);
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Twilio Device:', error);
      setIsInitializing(false);
    }
  };

  const makeCall = async (phoneNumber?: string) => {
    if (device && isReady) {
      console.log('📞 Making call to:', phoneNumber || TWILIO_CONFIG.TO_NUMBER);
      try {
        // Initiates the outgoing call using TwiML App
        const params = phoneNumber ? { To: phoneNumber } : {};
        (window as any).Twilio.Device.connect(params);
      } catch (error) {
        console.error('Failed to make call:', error);
      }
    } else {
      console.warn('⚠️ Twilio device not ready');
    }
  };

  const endCall = () => {
    if (device) {
      (window as any).Twilio.Device.disconnectAll();
      setIsConnected(false);
    }
  };

  const toggleMute = () => {
    if (device && isConnected) {
      const newMuted = !isMuted;
      // Note: Mute functionality depends on your TwiML configuration
      setIsMuted(newMuted);
      console.log('Mute toggled:', newMuted);
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
  };

  return (
    <TwilioContext.Provider value={value}>
      {children}
    </TwilioContext.Provider>
  );
};
