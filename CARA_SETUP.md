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

### Option B: Local Token Generation (Recommended)
Create a local Python script to generate tokens:

#### Create token_generator.py locally:

```python
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant

# Replace with your actual Twilio credentials
account_sid = "your_account_sid_here"
api_key_sid = "your_api_key_sid_here"  
api_key_secret = "your_api_secret_here"
twiml_app_sid = "your_twiml_app_sid_here"

# Identity for the browser user
identity = "user_123"

# Create the access token
token = AccessToken(
    account_sid,
    api_key_sid,
    api_key_secret,
    identity=identity,
    ttl=3600  # token valid for 1 hour
)

# Attach VoiceGrant
voice_grant = VoiceGrant(
    outgoing_application_sid=twiml_app_sid,
    incoming_allow=True
)
token.add_grant(voice_grant)

jwt_token = token.to_jwt()
print("Generated JWT Token:")
print(jwt_token)
```

#### Run the script:
```bash
python token_generator.py
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

In `src/lib/twilioTokenGenerator.ts`, replace the placeholder with your generated token:

```typescript
const jwtToken: string = "your_generated_jwt_token_here";
```

## Step 4: Test the Setup

1. Save the changes and refresh the page
2. Check the browser console for any errors
3. Click "Connect with Agent" - you should hear the phone ring on the target number
4. The call should connect and you'll hear audio through your browser

## Troubleshooting

### Common Issues:

1. **"JWT token is invalid or expired"**
   - Generate a new token using your local Python script
   - Tokens expire after 24 hours by default

2. **"Microphone permission denied"**
   - Allow microphone access in your browser
   - Check browser settings for microphone permissions

3. **"Device not ready"**
   - Check your JWT token is valid
   - Verify your Twilio credentials in your local script
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
1. Set up a backend token server for dynamic token generation
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

⚠️ **Requires local token generation for live calls**
```

**Ready to make live calls once configured!** 🎉