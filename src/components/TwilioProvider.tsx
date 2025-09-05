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

// Global variable to track initialization
let twilioInitialized = false;
let twilioDevice: any = null;

export const TwilioProvider: React.FC<TwilioProviderProps> = ({ children }) => {
  const [device, setDevice] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Twilio only when needed and outside React lifecycle
  const initializeTwilioDevice = async () => {
    if (twilioInitialized) {
      return twilioDevice;
    }

    try {
      console.log("🔧 Initializing Twilio Device on user interaction...");
      
      // Check if Twilio SDK is loaded
      if (!(window as any).Twilio) {
        console.error("❌ Twilio JS SDK not loaded");
        return null;
      }

      const token = TWILIO_CONFIG.JWT_TOKEN;
      
      // Check if token is provided
      if (!token || token === 'PASTE_YOUR_GENERATED_JWT_TOKEN_HERE') {
        console.warn('⚠️ Please provide a valid JWT token in TWILIO_CONFIG');
        return null;
      }

      console.log("🎤 Requesting microphone permissions...");
      
      // Request microphone permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone permission granted");
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.warn("⚠️ Microphone permission denied:", permissionError);
      }

      console.log('📱 Setting up Twilio Device...');
      
      // Setup device with minimal configuration
      (window as any).Twilio.Device.setup(token);
      
      twilioDevice = (window as any).Twilio.Device;
      
      // Setup event handlers
      (window as any).Twilio.Device.ready(() => {
        console.log("✅ Twilio Device Ready - You can now make calls!");
        setIsReady(true);
        setDevice(twilioDevice);
      });

      (window as any).Twilio.Device.error((error: any) => {
        console.error("❌ Twilio Device Error:", error);
        if (error.code === 31204) {
          console.error("🔑 JWT token is invalid or expired. Please generate a new token.");
        }
      });

      (window as any).Twilio.Device.connect((conn: any) => {
        console.log("📞 Call connected successfully");
        setIsConnected(true);
      });

      (window as any).Twilio.Device.disconnect((conn: any) => {
        console.log("📞 Call disconnected");
        setIsConnected(false);
      });

      twilioInitialized = true;
      return twilioDevice;
      
    } catch (error) {
      console.error('❌ Critical error during Twilio initialization:', error);
      return null;
    }
  };

  const makeCall = async (phoneNumber?: string) => {
    try {
      // Initialize Twilio if not already done
      const currentDevice = twilioDevice || await initializeTwilioDevice();
      
      if (currentDevice && isReady) {
        console.log('📞 Making call to:', phoneNumber || TWILIO_CONFIG.TO_NUMBER);
        const params = phoneNumber ? { To: phoneNumber } : {};
        (window as any).Twilio.Device.connect(params);
      } else if (currentDevice && !isReady) {
        console.warn('⚠️ Twilio device is initializing, please wait...');
      } else {
        console.warn('⚠️ Failed to initialize Twilio device');
      }
    } catch (error) {
      console.error('Failed to make call:', error);
    }
  };

  const endCall = () => {
    if (twilioDevice) {
      (window as any).Twilio.Device.disconnectAll();
      setIsConnected(false);
    }
  };

  const toggleMute = () => {
    if (twilioDevice && isConnected) {
      const newMuted = !isMuted;
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
