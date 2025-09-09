import time
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant

# Required credentials - UPDATE THESE VALUES WITH YOUR TWILIO CREDENTIALS
account_sid = "ff"  # Replace with your Account SID
api_key_sid = "ff"  # Replace with your API Key SID  
api_key_secret = "ff"  # Replace with your API Secret
twiml_app_sid = "ff"  # Replace with your TwiML App SID

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
print("\n✅ COPY THIS TOKEN INTO YOUR REACT APP:\n")
print(jwt_token)
print(f"\n🆔 Token Identity: {identity}")
print(f"⏰ Expires in: 1 hour")