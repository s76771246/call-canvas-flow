import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTwilio } from './TwilioProviderSimple';
import { generateTwilioToken } from '@/lib/twilioTokenGenerator';

export const CallInterface = () => {
  const { 
    isConnected, 
    isMuted, 
    isRinging, 
    makeCall, 
    endCall, 
    toggleMute,
    initializationError,
    clearError
  } = useTwilio();

  // Hardcoded values - token will be generated automatically
  const phoneNumber = '+919759206343';
  const [callDuration, setCallDuration] = useState(0);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isConnected) {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      if (interval) {
        clearInterval(interval);
      }
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConnectClick = async () => {
    setIsGeneratingToken(true);
    
    try {
      // Clear any existing errors
      clearError();
      
      // Generate token automatically
      const token = await generateTwilioToken();
      
      // Make call with generated token
      makeCall(phoneNumber, token);
    } catch (error) {
      console.error('Failed to generate token or make call:', error);
      // The error will be handled by the Twilio provider
    } finally {
      setIsGeneratingToken(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">CARA</h1>
            <p className="text-muted-foreground">
              Connect with our voice agent
            </p>
          </div>

          <div className="space-y-6">
            {/* Error Display */}
            {initializationError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-destructive whitespace-pre-line">
                    {initializationError}
                    {initializationError.includes('JWT token') && (
                      <div className="mt-2 text-xs">
                        <p>To fix this:</p>
                        <p>1. Run your Python backend code to generate a JWT token</p>
                        <p>2. Paste the token in src/lib/twilioTokenGenerator.ts</p>
                        <p>3. Or set up a backend endpoint at /api/twilio/token</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Call Interface */}
            {isConnected ? (
              /* CONNECTED STATE - Always show this when connected */
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-medium text-green-600">Connected</span>
                </div>
                
                {/* Call Timer */}
                <div className="flex items-center justify-center space-x-2 text-2xl font-mono font-bold text-primary">
                  <Clock className="h-6 w-6" />
                  <span>{formatDuration(callDuration)}</span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Call active with agent
                </p>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={toggleMute}
                    variant={isMuted ? "destructive" : "outline"}
                    size="lg"
                    className="flex-1"
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    onClick={endCall}
                    variant="destructive"
                    size="lg"
                    className="flex-1"
                  >
                    <PhoneOff className="mr-2 h-5 w-5" />
                    End Call
                  </Button>
                </div>
              </div>
            ) : isRinging ? (
              /* CALLING STATE */
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-pulse">
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="text-lg font-medium">Calling...</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connecting to agent
                </p>
                <Button
                  onClick={endCall}
                  variant="destructive"
                  size="lg"
                  className="w-full h-12"
                >
                  <PhoneOff className="mr-2 h-5 w-5" />
                  End Call
                </Button>
              </div>
            ) : (
              /* IDLE STATE - Ready to call */
              <Button
                onClick={handleConnectClick}
                size="lg"
                className="w-full h-16 text-lg font-semibold"
                variant="default"
                disabled={isGeneratingToken}
              >
                <Phone className="mr-2 h-6 w-6" />
                {isGeneratingToken ? "Connecting..." : "Connect with Agent"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};