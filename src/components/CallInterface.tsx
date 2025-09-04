import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import avatar from '@/assets/avatar.jpg';

type CallState = 'idle' | 'calling' | 'connected' | 'ended';

interface CallInterfaceProps {
  onInitiateCall?: () => void;
  onEndCall?: () => void;
  onMute?: (muted: boolean) => void;
  onSpeaker?: (enabled: boolean) => void;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({
  onInitiateCall,
  onEndCall,
  onMute,
  onSpeaker
}) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCall = () => {
    setCallState('calling');
    onInitiateCall?.();
    
    // Simulate call connection after 3 seconds
    setTimeout(() => {
      setCallState('connected');
    }, 3000);
  };

  const handleEndCall = () => {
    setCallState('ended');
    setCallDuration(0);
    onEndCall?.();
    
    // Reset to idle after animation
    setTimeout(() => {
      setCallState('idle');
    }, 1000);
  };

  const handleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    onMute?.(newMuted);
  };

  const handleSpeaker = () => {
    const newSpeaker = !speakerEnabled;
    setSpeakerEnabled(newSpeaker);
    onSpeaker?.(newSpeaker);
  };

  const handleVideo = () => {
    setVideoEnabled(!videoEnabled);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
          <p className="text-lg text-muted-foreground mb-8">Start your conversation with a single tap</p>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCall}
              size="lg"
              className="glass glass-hover gradient-primary text-white font-semibold px-8 py-6 text-lg rounded-2xl shadow-glow animate-glow"
            >
              <Phone className="mr-3 h-6 w-6" />
              Call Me
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
                      onClick={handleVideo}
                      className={`glass glass-hover p-4 rounded-full ${
                        videoEnabled ? 'bg-primary/20 border-primary/30' : ''
                      }`}
                    >
                      {videoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
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