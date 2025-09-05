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

  useEffect(() => {
    // Use setTimeout to ensure this runs after React's render cycle
    const timer = setTimeout(() => {
      initializeDevice();
    }, 500);

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      if ((window as any).Twilio?.Device) {
        try {
          (window as any).Twilio.Device.disconnectAll();
        } catch (error) {
          console.warn('Error during cleanup:', error);
        }
      }
    };
  }, []);

  const initializeDevice = async () => {
    try {
      console.log("🔧 Starting Twilio Device initialization...");
      
      // Check if Twilio SDK is loaded
      if (!(window as any).Twilio) {
        console.error("❌ Twilio JS SDK not loaded");
        return;
      }

      const token = TWILIO_CONFIG.JWT_TOKEN;
      
      // Check if token is provided
      if (!token || token === 'PASTE_YOUR_GENERATED_JWT_TOKEN_HERE') {
        console.warn('⚠️ Please provide a valid JWT token in TWILIO_CONFIG');
        return;
      }

      // Ensure we have audio context support
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.warn('⚠️ Audio context not supported in this browser');
      }

      console.log("🎤 Requesting microphone permissions...");
      
      // Request microphone permissions and handle properly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone permission granted");
        // Important: Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Small delay to ensure audio context is ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (permissionError) {
        console.warn("⚠️ Microphone permission denied:", permissionError);
        // Don't return, continue with setup
      }

      console.log('📱 Setting up Twilio Device with legacy method...');
      
      // Use the most basic setup approach
      try {
        (window as any).Twilio.Device.setup(token);
        
        // Store reference to device
        setDevice((window as any).Twilio.Device);
        
        // Setup event handlers with improved logging
        (window as any).Twilio.Device.ready(() => {
          console.log("✅ Twilio Device Ready - You can now make calls!");
          setIsReady(true);
        });

        (window as any).Twilio.Device.error((error: any) => {
          console.error("❌ Twilio Device Error:", error);
          if (error.code === 31204) {
            console.error("🔑 JWT token is invalid or expired. Please generate a new token.");
          } else if (error.code === 31208) {
            console.error("🔑 JWT token is malformed.");
          } else {
            console.error(`🔑 Error code: ${error.code}, Message: ${error.message}`);
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

        console.log("🎯 Twilio Device setup completed, waiting for ready event...");
        
      } catch (setupError) {
        console.error('❌ Failed to setup Twilio Device:', setupError);
      }
      
    } catch (error) {
      console.error('❌ Critical error during Twilio initialization:', error);
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
