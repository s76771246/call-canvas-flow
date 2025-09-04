import React, { createContext, useContext, useEffect, useState } from 'react';
import { Device } from '@twilio/voice-sdk';

interface TwilioContextType {
  device: Device | null;
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

// Configuration - Replace these with your actual values
const TWILIO_CONFIG = {
  // You'll need to create an endpoint that generates access tokens
  // This should be your backend endpoint that returns a JWT token
  ACCESS_TOKEN_URL: '/api/twilio/token', // Replace with your backend endpoint
  
  // Dummy phone numbers - replace these with your actual numbers
  FROM_NUMBER: '+1234567890', // Replace with your Twilio phone number
  TO_NUMBER: '+0987654321',   // Replace with target phone number
};

export const TwilioProvider: React.FC<TwilioProviderProps> = ({ children }) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    initializeDevice();
  }, []);

  const initializeDevice = async () => {
    try {
      // Fetch access token from your backend
      // For now, you'll need to implement this endpoint
      // const response = await fetch(TWILIO_CONFIG.ACCESS_TOKEN_URL);
      // const { token } = await response.json();
      
      // Temporary: Use a placeholder token - replace this with actual token fetch
      console.log('Note: Replace this with actual token fetch from your backend');
      const token = 'your-jwt-token-here'; // This needs to come from your backend
      
      const twilioDevice = new Device(token, {
        logLevel: 1,
      });
      
      setDevice(twilioDevice);
      
      // Set up event listeners
      twilioDevice.on('ready', () => {
        console.log('Twilio Device is ready for calls');
        setIsReady(true);
      });
      
      twilioDevice.on('connect', (conn) => {
        console.log('Call connected');
        setIsConnected(true);
      });
      
      twilioDevice.on('disconnect', (conn) => {
        console.log('Call disconnected');
        setIsConnected(false);
      });
      
      twilioDevice.on('error', (error) => {
        console.error('Twilio Device error:', error);
      });
      
    } catch (error) {
      console.error('Failed to initialize Twilio Device:', error);
    }
  };

  const makeCall = async (phoneNumber?: string) => {
    if (device && isReady) {
      const params = {
        'To': phoneNumber || TWILIO_CONFIG.TO_NUMBER,
      };
      
      console.log('Making call to:', phoneNumber || TWILIO_CONFIG.TO_NUMBER);
      try {
        const call = await device.connect({ params });
        
        call.on('accept', () => {
          console.log('Call accepted');
          setIsConnected(true);
        });
        
        call.on('disconnect', () => {
          console.log('Call disconnected');
          setIsConnected(false);
        });
        
      } catch (error) {
        console.error('Failed to make call:', error);
      }
      
    } else {
      console.warn('Device not ready for calls');
    }
  };

  const endCall = () => {
    if (device) {
      device.disconnectAll();
      setIsConnected(false);
    }
  };

  const toggleMute = () => {
    if (device && isConnected) {
      // Get all active calls and mute the first one
      device.calls.forEach((call) => {
        const newMuted = !isMuted;
        call.mute(newMuted);
        setIsMuted(newMuted);
      });
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