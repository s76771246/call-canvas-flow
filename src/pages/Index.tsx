import React from 'react';
import { motion } from 'framer-motion';
import { CallInterface } from '@/components/CallInterface';
import { TwilioProvider } from '@/components/TwilioProvider';

const Index = () => {
  return (
    <TwilioProvider>
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <div className="relative z-10">
          <CallInterface
            onInitiateCall={() => {
              console.log('Initiating call...');
              // Here you would integrate with your Twilio implementation
            }}
            onEndCall={() => {
              console.log('Ending call...');
              // Here you would handle call termination
            }}
            onMute={(muted) => {
              console.log('Mute toggled:', muted);
              // Here you would handle mute functionality
            }}
            onSpeaker={(enabled) => {
              console.log('Speaker toggled:', enabled);
              // Here you would handle speaker functionality
            }}
          />
        </div>
      </div>
    </TwilioProvider>
  );
};

export default Index;
