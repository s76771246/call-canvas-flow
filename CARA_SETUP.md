# CARA - Voice Calling Interface Setup

## 🚨 CRITICAL: Live Calling Setup Required

**CARA is currently running in DEMO MODE.** To make actual phone calls, you must complete the following setup:

## Step 1: Get Your Twilio Credentials

1. **Create a Twilio Account**: Go to [https://www.twilio.com](https://www.twilio.com) and sign up
2. **Get a Phone Number**: Purchase a Twilio phone number from the Console
3. **Find Your Credentials**: Go to Console Dashboard and note:
   - Account SID
   - Auth Token
   - Your Twilio Phone Number

## Step 2: Create TwiML Application

1. Go to [Twilio Console > Develop > TwiML > TwiML Apps](https://console.twilio.com/develop/twiml/twiml-apps)
2. Click "Create new TwiML App"
3. Set these webhooks:
   - **Voice URL**: `https://your-backend.com/api/twilio/voice` (or use the example below)
   - **Voice Method**: POST
4. Save and copy the **TwiML App SID**

## Step 3: Generate Access Token

### Option A: Quick Test (Temporary Token)
1. Go to [Twilio Console > Voice > Manage > Access Tokens](https://console.twilio.com/develop/voice/manage/access-tokens)
2. Click "Create an Access Token"
3. Set Identity: `TestUser`
4. Copy the generated JWT token

### Option B: Backend Setup (Recommended for Production)
Set up a backend endpoint to generate tokens dynamically:

#### Environment Variables

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=your_api_key_here
TWILIO_API_SECRET=your_api_secret_here
TWILIO_PHONE_NUMBER=+1234567890
```

#### Token Endpoint

```javascript
// Node.js/Express example
const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

app.post('/api/twilio/token', (req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  
  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity: 'user_' + Date.now()
  });
  
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
    incomingAllow: true
  });
  
  token.addGrant(voiceGrant);
  
  res.json({ token: token.toJwt() });
});
```

#### TwiML Application
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

## Step 3: Update Frontend Configuration

In `src/components/TwilioProvider.tsx`, update the `TWILIO_CONFIG` object:

```typescript
const TWILIO_CONFIG = {
  // Paste your JWT token here (from Step 2)
  JWT_TOKEN: 'eyJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIiwidHlwIjoiSldUIn0...',
  
  // Your Twilio phone number
  FROM_NUMBER: '+15551234567',
  
  // Phone number to call for testing
  TO_NUMBER: '+15559876543',
};
```

## Step 4: Test the Setup

1. Save the changes and refresh the page
2. Check the browser console for any errors
3. Click "Call Me" - you should hear the phone ring on the target number
4. The call should connect and you'll hear audio through your browser

## Troubleshooting

### Common Issues:

1. **"JWT token is invalid or expired"**
   - Generate a new token from Twilio Console
   - Tokens expire after 24 hours by default

2. **"Microphone permission denied"**
   - Allow microphone access in your browser
   - Check browser settings for microphone permissions

3. **"Device not ready"**
   - Check your JWT token is valid
   - Verify your Twilio credentials
   - Check browser console for detailed errors

4. **Call connects but no audio**
   - Check microphone permissions
   - Try using headphones to avoid echo
   - Verify TwiML application is configured correctly

### Debug Mode:
The app now includes detailed console logging. Open browser DevTools to see:
- Initialization status
- Configuration issues
- Call connection details
- Error messages with solutions

## Production Considerations

For production use:
1. Set up a backend token server (don't hardcode JWT tokens)
2. Implement proper error handling
3. Add user authentication
4. Configure TwiML applications for your use case
5. Set up proper CORS policies
6. Monitor call quality and usage

## Current Status

✅ **Project renamed to CARA**  
✅ **Modern glassmorphism UI**  
✅ **Real Twilio Voice SDK integration**  
✅ **Call controls (mute, speaker, end)**  
✅ **Call duration timer**  
✅ **Error handling and validation**  
✅ **Configuration validation**  
✅ **Debug mode with detailed logging**  

⚠️ **Requires Twilio setup for live calls**
```

**Ready to make live calls once configured!** 🎉