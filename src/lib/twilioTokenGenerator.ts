// Required credentials - UPDATE THESE VALUES WITH YOUR TWILIO CREDENTIALS
const TWILIO_CONFIG = {
  account_sid: "AC61be89f63333b748858f9671feef26d5",  // Replace with your Account SID
  api_key_sid: "SK1f80046aafe5ba42d3230b7d00c8e11f",  // Replace with your API Key SID  
  api_key_secret: "kjc3hdMZ3zf1CwJZReAStBZQZHkMIV1w",  // Replace with your API Secret
  twiml_app_sid: "ff"  // Replace with your TwiML App SID
};

// Identity for the browser user (no spaces, only alphanumeric + underscore)
const identity = "user_123";

/**
 * Generate Twilio Access Token
 * This simulates backend token generation for demo purposes
 * In production, this should be done on your secure backend
 */
export const generateTwilioToken = async (): Promise<string> => {
  try {
    // Import Twilio dynamically
    const twilioModule = await import('twilio');
    const AccessToken = twilioModule.jwt.AccessToken;
    const VoiceGrant = twilioModule.jwt.AccessToken.VoiceGrant;
    
    // Create the access token
    const token = new AccessToken(
      TWILIO_CONFIG.account_sid,
      TWILIO_CONFIG.api_key_sid,
      TWILIO_CONFIG.api_key_secret,
      { identity, ttl: 3600 } // token valid for 1 hour
    );

    // Attach VoiceGrant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: TWILIO_CONFIG.twiml_app_sid,
      incomingAllow: true
    });
    
    token.addGrant(voiceGrant);
    
    // Generate JWT token
    const jwtToken = token.toJwt();
    console.log('Generated Twilio token for identity:', identity);
    return jwtToken;
    
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    throw new Error('Failed to generate Twilio token');
  }
};