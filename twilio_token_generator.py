from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant

# Required credentials - REPLACE THESE VALUES WITH YOUR ACTUAL TWILIO CREDENTIALS
account_sid = "AC61be89f63333b748858f9671feef26d5"  # Replace with your Account SID
api_key_sid = "SK1f80046aafe5ba42d3230b7d00c8e11f"  # Replace with your API Key SID  
api_key_secret = "kjc3hdMZ3zf1CwJZReAStBZQZHkMIV1w"  # Replace with your API Secret
twiml_app_sid = "APa5fee892ac98fdfb8fd8d0ba4eb07b4a"  # Replace with your TwiML App SID

# Identity for the browser user (no spaces, only alphanumeric + underscore)
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
print("\n" + "="*80)
print("🎯 TWILIO ACCESS TOKEN GENERATOR")
print("="*80)
print(f"📱 Identity: {identity}")
print(f"⏰ Token expires in: 1 hour")
print("\n🔑 COPY THIS TOKEN:")
print("-" * 80)
print(jwt_token)
print("-" * 80)
print("\n📋 INSTRUCTIONS:")
print("1. Copy the token above")
print("2. Paste it in src/lib/twilioTokenGenerator.ts (replace PASTE_YOUR_JWT_TOKEN_HERE)")
print("3. Save the file and test your call")
print("="*80)
