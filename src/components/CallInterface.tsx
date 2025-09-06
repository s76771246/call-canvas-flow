import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTwilio } from '@/components/TwilioProvider';
import avatar from '@/assets/avatar.jpg';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

type CallState = 'idle' | 'calling' | 'connected' | 'ended';

interface CallInterfaceProps {}

export const CallInterface: React.FC<CallInterfaceProps> = () => {
  const { device, isReady, isConnected, isMuted, makeCall, endCall, toggleMute, initializationError } = useTwilio();
  const [callState, setCallState] = useState<CallState>('idle');
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Sync callState with Twilio connection status
  useEffect(() => {
    if (isConnected && callState !== 'connected') {
      setCallState('connected');
      setCallDuration(0); // Reset timer when call connects
    } else if (!isConnected && callState === 'connected') {
      setCallState('ended');
      setTimeout(() => setCallState('idle'), 1000);
    }
  }, [isConnected, callState]);

  // Timer only runs when actually connected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected, callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCall = () => {
    console.log('📞 Call button clicked');
    setCallState('calling');
    // makeCall will now handle initialization internally
    makeCall();
  };

  const handleEndCall = () => {
    endCall();
    setCallDuration(0);
  };

  const handleMute = () => {
    toggleMute();
  };

  const handleSpeaker = () => {
    setSpeakerEnabled(!speakerEnabled);
    // Note: Speaker functionality would need additional Twilio configuration
    console.log('Speaker toggled:', !speakerEnabled);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Configuration Error Alert */}
      {initializationError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-4xl mx-auto"
        >
          <Alert className="glass border-primary/50 bg-primary/10 text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line text-sm leading-relaxed">
              {initializationError}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {callState === 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="mb-8"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={avatar}
              alt="Contact"
              className="w-32 h-32 rounded-full mx-auto mb-4 shadow-glow ring-4 ring-primary/20"
            />
          </motion.div>
          
          <h1 className="text-4xl font-bold mb-2 text-shadow">Ready to Connect</h1>
          <p className="text-lg text-muted-foreground mb-4">
            {isReady ? 'Start your conversation with a single tap' : 'Initializing Twilio...'}
          </p>
          
          {!isReady && !initializationError && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Setting up voice connection...</span>
            </div>
          )}
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCall}
              disabled={false}
              size="lg"
              className="glass glass-hover gradient-primary text-white font-semibold px-8 py-6 text-lg rounded-2xl shadow-glow animate-glow"
            >
              <Phone className="mr-3 h-6 w-6" />
              {initializationError ? 'Demo Call' : 'Call Me'}
            </Button>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {(callState === 'calling' || callState === 'connected' || callState === 'ended') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass rounded-3xl p-8 w-full max-w-md text-center relative overflow-hidden"
            >
              {/* Background Animation */}
              <motion.div
                className="absolute inset-0 gradient-calling opacity-30"
                animate={{
                  background: [
                    'linear-gradient(135deg, hsl(263 70% 50% / 0.3), hsl(280 70% 60% / 0.3))',
                    'linear-gradient(135deg, hsl(280 70% 60% / 0.3), hsl(300 70% 50% / 0.3))',
                    'linear-gradient(135deg, hsl(263 70% 50% / 0.3), hsl(280 70% 60% / 0.3))'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <div className="relative z-10">
                {callState === 'calling' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <div className="relative inline-block">
                      <img
                        src={avatar}
                        alt="Calling"
                        className="w-24 h-24 rounded-full mx-auto shadow-glow"
                      />
                      {/* Pulse rings */}
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/50"
                        animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/30"
                        animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                    </div>
                    <h3 className="text-2xl font-semibold mt-4 text-shadow">Calling...</h3>
                    <p className="text-muted-foreground">Connecting to your contact</p>
                  </motion.div>
                )}

                {callState === 'connected' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <motion.img
                      src={avatar}
                      alt="Connected"
                      className="w-24 h-24 rounded-full mx-auto shadow-glow mb-4"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <h3 className="text-2xl font-semibold text-shadow">Connected</h3>
                    <motion.p
                      className="text-primary font-mono text-lg"
                      key={callDuration}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                    >
                      {formatDuration(callDuration)}
                    </motion.p>
                  </motion.div>
                )}

                {callState === 'ended' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <img
                      src={avatar}
                      alt="Call Ended"
                      className="w-24 h-24 rounded-full mx-auto shadow-soft opacity-60 mb-4"
                    />
                    <h3 className="text-2xl font-semibold text-shadow">Call Ended</h3>
                    <p className="text-muted-foreground">Thanks for connecting</p>
                  </motion.div>
                )}

                {/* Call Controls */}
                {callState === 'connected' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center space-x-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleMute}
                      className={`glass glass-hover p-4 rounded-full ${
                        isMuted ? 'bg-destructive/20 border-destructive/30' : ''
                      }`}
                    >
                      {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSpeaker}
                      className={`glass glass-hover p-4 rounded-full ${
                        speakerEnabled ? 'bg-primary/20 border-primary/30' : ''
                      }`}
                    >
                      {speakerEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                    </motion.button>


                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleEndCall}
                      className="bg-destructive/20 border-destructive/30 glass p-4 rounded-full hover:bg-destructive/30"
                    >
                      <PhoneOff className="h-6 w-6 text-destructive" />
                    </motion.button>
                  </motion.div>
                )}

                {callState === 'calling' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleEndCall}
                      className="bg-destructive/20 border-destructive/30 glass p-4 rounded-full hover:bg-destructive/30"
                    >
                      <PhoneOff className="h-6 w-6 text-destructive" />
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};