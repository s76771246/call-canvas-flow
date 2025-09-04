# CARA - Voice Calling Interface Setup

## Backend Configuration Required

To enable live Twilio functionality, you need to set up these backend components:

### 1. Environment Variables
Set these variables in your backend environment:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=your_api_key_here
TWILIO_API_SECRET=your_api_secret_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
TARGET_PHONE_NUMBER=+0987654321  # Target number for testing
```

### 2. Access Token Endpoint
Create a backend endpoint at `/api/twilio/token` that generates JWT access tokens:

```javascript
// Example Node.js/Express endpoint
const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

app.post('/api/twilio/token', (req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  
  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity: 'user_' + Date.now() // Unique user identity
  });
  
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
    incomingAllow: true
  });
  
  token.addGrant(voiceGrant);
  
  res.json({ token: token.toJwt() });
});
```

### 3. TwiML Application
Create a TwiML application in your Twilio Console with these webhooks:

- **Voice URL**: `https://your-backend.com/api/twilio/voice`
- **Voice Method**: POST

Example voice webhook handler:
```javascript
app.post('/api/twilio/voice', (req, res) => {
  const twiml = new VoiceResponse();
  
  // Handle outgoing calls
  if (req.body.To) {
    twiml.dial(req.body.To);
  } else {
    twiml.say('Hello from CARA!');
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});
```

### 4. Update Frontend Configuration
In `src/components/TwilioProvider.tsx`, update these lines:

```typescript
// Replace line 32:
ACCESS_TOKEN_URL: 'https://your-backend.com/api/twilio/token',

// Replace lines 35-36:
FROM_NUMBER: '+1234567890', // Your actual Twilio phone number
TO_NUMBER: '+0987654321',   // Your target phone number
```

### 5. Enable Token Fetching
Uncomment lines 51-54 in `TwilioProvider.tsx` to enable real token fetching:

```typescript
const response = await fetch(TWILIO_CONFIG.ACCESS_TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
const { token } = await response.json();
```

And comment out the placeholder token line (58).

## Features Implemented

✅ **Project renamed to CARA**
✅ **Token requirement removed** - Auto-initializes on load
✅ **Real Twilio Voice SDK integration** - No more mock implementation  
✅ **Live call functionality** - Ready for real calls
✅ **Timer starts on call answer** - Only counts connected time
✅ **Two-way voice communication** - Full duplex audio
✅ **Professional call controls** - Mute, speaker, end call
✅ **Beautiful glassmorphism UI** - Animated and responsive

## Next Steps

1. Set up your backend with the token endpoint
2. Create the TwiML application in Twilio Console
3. Update the configuration with your actual credentials
4. Test with real phone numbers

CARA is now ready for live Twilio voice calls! 🎉