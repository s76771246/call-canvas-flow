import React, { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTwilio } from './TwilioProvider';

export const CallInterface = () => {
  const { 
    isConnected, 
    isMuted, 
    isRinging, 
    makeCall, 
    endCall, 
    toggleMute,
    initializationError,
    tokenValidation,
    validateAndSetToken,
    clearError
  } = useTwilio();

  const [token, setToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91 97592 06343');

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    setToken(newToken);
    if (initializationError) {
      clearError();
    }
    if (newToken.trim()) {
      validateAndSetToken(newToken);
    }
  };

  const handleCallClick = () => {
    if (!token.trim()) {
      validateAndSetToken('');
      return;
    }
    makeCall(phoneNumber, token);
  };

  const isTokenValid = tokenValidation?.isValid;
  const canMakeCall = isTokenValid && !isConnected && !isRinging;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Voice Call Demo</h1>
            <p className="text-muted-foreground">
              Enter your Twilio JWT token to make calls
            </p>
          </div>

          <div className="space-y-6">
            {/* Token Input */}
            <div className="space-y-2">
              <Label htmlFor="token">Twilio JWT Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter your JWT token..."
                value={token}
                onChange={handleTokenChange}
                className={`${tokenValidation && !tokenValidation.isValid ? 'border-destructive' : ''} ${isTokenValid ? 'border-green-500' : ''}`}
              />
              {tokenValidation && (
                <div className={`flex items-center space-x-2 text-sm ${isTokenValid ? 'text-green-600' : 'text-destructive'}`}>
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {isTokenValid 
                      ? `✓ Valid token for ${tokenValidation.identity}` 
                      : tokenValidation.error
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number to Call</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            {/* Error Display */}
            {initializationError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">
                    {initializationError}
                  </p>
                </div>
              </div>
            )}

            {/* Call Interface */}
            {!isConnected && !isRinging ? (
              <Button
                onClick={handleCallClick}
                disabled={!canMakeCall}
                size="lg"
                className="w-full h-16 text-lg font-semibold"
                variant={canMakeCall ? "default" : "secondary"}
              >
                <Phone className="mr-2 h-6 w-6" />
                {canMakeCall ? 'Call Now' : 'Enter Valid Token'}
              </Button>
            ) : isRinging ? (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-pulse">
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="text-lg font-medium">Calling...</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connecting to {phoneNumber}
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
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-medium text-green-600">Connected</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Call active with {phoneNumber}
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};