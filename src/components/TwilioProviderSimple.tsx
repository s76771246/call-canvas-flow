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
  console.log('TwilioProvider rendering...');
  
  const [device, setDevice] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<{ isValid: boolean; error?: string; identity?: string; exp?: number } | null>(null);
  const [currentToken, setCurrentToken] = useState<string>('');

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

  // Simplified functions for now
  const makeCall = (phoneNumber?: string, token?: string) => {
    console.log('makeCall called');
    setIsRinging(true);
    // Simulate connection after 2 seconds
    setTimeout(() => {
      setIsRinging(false);
      setIsConnected(true);
    }, 2000);
  };

  const endCall = () => {
    console.log('endCall called');
    setIsConnected(false);
    setIsRinging(false);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
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