import React, { createContext, useContext, useEffect, useState } from 'react';

// Twilio Voice SDK types (you'll need to install @twilio/voice-sdk)
interface TwilioDevice {
  setup: (token: string) => void;
  connect: (params?: any) => void;
  disconnect: () => void;
  on: (event: string, callback: Function) => void;
  mute: (muted: boolean) => void;
}

interface TwilioContextType {
  device: TwilioDevice | null;
  isReady: boolean;
  isConnected: boolean;
  isMuted: boolean;
  initializeDevice: (accessToken: string) => void;
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

export const TwilioProvider: React.FC<TwilioProviderProps> = ({ children }) => {
  const [device, setDevice] = useState<TwilioDevice | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const initializeDevice = async (accessToken: string) => {
    try {
      // Dynamically import Twilio Device SDK
      // You'll need to install: npm install @twilio/voice-sdk
      // const { Device } = await import('@twilio/voice-sdk');
      
      // For now, we'll create a mock device for demonstration
      const mockDevice: TwilioDevice = {
        setup: (token: string) => {
          console.log('Mock device setup with token:', token);
          setTimeout(() => setIsReady(true), 1000);
        },
        connect: (params?: any) => {
          console.log('Mock device connecting...', params);
          setTimeout(() => setIsConnected(true), 2000);
        },
        disconnect: () => {
          console.log('Mock device disconnecting...');
          setIsConnected(false);
        },
        on: (event: string, callback: Function) => {
          console.log('Mock device event listener:', event);
          // Mock event handling
          if (event === 'ready') {
            setTimeout(callback, 1000);
          }
        },
        mute: (muted: boolean) => {
          console.log('Mock device mute:', muted);
          setIsMuted(muted);
        }
      };

      setDevice(mockDevice);
      mockDevice.setup(accessToken);

      // Set up event listeners
      mockDevice.on('ready', () => {
        console.log('Twilio Device is ready');
        setIsReady(true);
      });

      mockDevice.on('connect', () => {
        console.log('Call connected');
        setIsConnected(true);
      });

      mockDevice.on('disconnect', () => {
        console.log('Call disconnected');
        setIsConnected(false);
      });

    } catch (error) {
      console.error('Failed to initialize Twilio Device:', error);
    }
  };

  const makeCall = (phoneNumber?: string) => {
    if (device && isReady) {
      // In a real implementation, you'd pass the phone number or other parameters
      device.connect({
        To: phoneNumber || '+1234567890', // Default number for demo
      });
    } else {
      console.warn('Device not ready for calls');
    }
  };

  const endCall = () => {
    if (device && isConnected) {
      device.disconnect();
    }
  };

  const toggleMute = () => {
    if (device) {
      const newMuted = !isMuted;
      device.mute(newMuted);
      setIsMuted(newMuted);
    }
  };

  const value: TwilioContextType = {
    device,
    isReady,
    isConnected,
    isMuted,
    initializeDevice,
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

// Configuration component for Twilio credentials
export const TwilioConfig: React.FC = () => {
  const { initializeDevice, isReady } = useTwilio();
  const [accessToken, setAccessToken] = useState('');

  const handleInitialize = () => {
    if (accessToken.trim()) {
      initializeDevice(accessToken.trim());
    } else {
      // For demo purposes, use a mock token
      initializeDevice('mock-twilio-access-token');
    }
  };

  return (
    <div className="glass rounded-2xl p-6 max-w-md mx-auto mb-8">
      <h3 className="text-xl font-semibold mb-4 text-center">Twilio Configuration</h3>
      
      {!isReady ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Access Token (Optional for Demo)
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Your Twilio Access Token"
              className="w-full px-3 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <button
            onClick={handleInitialize}
            className="w-full gradient-primary text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Initialize Twilio Device
          </button>
          
          <p className="text-xs text-muted-foreground text-center">
            Leave empty to use demo mode with mock calls
          </p>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-success/20 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-success rounded-full animate-pulse"></div>
          </div>
          <p className="text-success font-medium">Twilio Device Ready</p>
        </div>
      )}
    </div>
  );
};