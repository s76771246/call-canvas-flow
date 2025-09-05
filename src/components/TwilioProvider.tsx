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
  JWT_TOKEN: 'PASTE_YOUR_GENERATED_JWT_TOKEN_HERE',
  
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
    initializeDevice();
  }, []);

  const initializeDevice = async () => {
    try {
      if (!(window as any).Twilio) {
        console.error("Twilio JS SDK not loaded");
        return;
      }

      const token = TWILIO_CONFIG.JWT_TOKEN;
      
      if (token === 'PASTE_YOUR_GENERATED_JWT_TOKEN_HERE') {
        console.warn('Please replace the JWT_TOKEN in TWILIO_CONFIG with your actual generated token');
        return;
      }

      // Setup Twilio Device with the token
      (window as any).Twilio.Device.setup(token);
      setDevice((window as any).Twilio.Device);

      (window as any).Twilio.Device.ready(() => {
        console.log("Twilio Device Ready");
        setIsReady(true);
      });

      (window as any).Twilio.Device.error((error: any) => {
        console.error("Twilio Device Error:", error);
      });

      (window as any).Twilio.Device.connect((conn: any) => {
        console.log("Call connected");
        setIsConnected(true);
      });

      (window as any).Twilio.Device.disconnect((conn: any) => {
        console.log("Call disconnected");
        setIsConnected(false);
      });
      
    } catch (error) {
      console.error('Failed to initialize Twilio Device:', error);
    }
  };

  const makeCall = async (phoneNumber?: string) => {
    if (device && isReady) {
      console.log('Making call to:', phoneNumber || TWILIO_CONFIG.TO_NUMBER);
      try {
        // Initiates the outgoing call using TwiML App
        (window as any).Twilio.Device.connect();
      } catch (error) {
        console.error('Failed to make call:', error);
      }
    } else {
      console.warn('Device not ready for calls');
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