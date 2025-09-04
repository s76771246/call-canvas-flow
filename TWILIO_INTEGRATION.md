# Twilio Integration Guide

This calling interface is designed to work with Twilio Voice SDK. Follow these steps to integrate your Twilio account:

## 1. Install Twilio Voice SDK

```bash
npm install @twilio/voice-sdk
```

## 2. Get Your Twilio Credentials

From your [Twilio Console](https://console.twilio.com/):
- Account SID
- Auth Token
- Twilio Phone Number

## 3. Create Access Tokens

You'll need to create a server endpoint that generates access tokens for your application. Here's a sample implementation:

### Backend (Node.js/Express)
```javascript
const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

app.post('/token', (req, res) => {
  const accountSid = 'your_account_sid';
  const apiKey = 'your_api_key';
  const apiSecret = 'your_api_secret';
  
  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity: 'user_identity'
  });
  
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: 'your_twiml_app_sid',
    incomingAllow: true
  });
  
  token.addGrant(voiceGrant);
  
  res.json({ token: token.toJwt() });
});
```

## 4. Update TwilioProvider Component

Replace the mock implementation in `src/components/TwilioProvider.tsx`:

```typescript
import { Device } from '@twilio/voice-sdk';

const initializeDevice = async (accessToken: string) => {
  try {
    const device = new Device(accessToken);
    setDevice(device);
    
    device.on('ready', () => {
      console.log('Twilio Device is ready');
      setIsReady(true);
    });
    
    device.on('connect', (conn) => {
      console.log('Call connected');
      setIsConnected(true);
    });
    
    device.on('disconnect', (conn) => {
      console.log('Call disconnected');
      setIsConnected(false);
    });
    
  } catch (error) {
    console.error('Failed to initialize Twilio Device:', error);
  }
};
```

## 5. Environment Variables

Create environment variables for your Twilio configuration:

```env
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## 6. TwiML Applications

Create a TwiML application in your Twilio Console with appropriate webhooks for handling incoming and outgoing calls.

## 7. Testing

1. Initialize the Twilio device with your access token
2. Click "Call Me" to test outgoing calls
3. Use the call controls to test mute, speaker, and other features

## Features Included

- ✅ Glassmorphism UI design
- ✅ Animated calling states
- ✅ Call controls (mute, speaker, video, end call)
- ✅ Call duration timer
- ✅ Responsive design
- ✅ Framer Motion animations
- ✅ Mock implementation for testing

## Demo Mode

The current implementation includes a mock Twilio device for demonstration purposes. This allows you to test the UI without actual Twilio integration.

## Need Help?

- [Twilio Voice SDK Documentation](https://www.twilio.com/docs/voice/sdks/javascript)
- [Twilio Console](https://console.twilio.com/)
- [TwiML Applications Guide](https://www.twilio.com/docs/voice/twiml)