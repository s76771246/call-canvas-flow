import os
from dotenv import load_dotenv
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant

# Load credentials from .env file
load_dotenv()

# REPLACE THESE WITH YOUR REAL TWILIO CREDENTIALS
TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Your Account SID from Twilio Console
TWILIO_API_KEY = "SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"      # Create API Key in Twilio Console
TWILIO_API_SECRET = "your_api_secret_here"                  # API Secret from Twilio Console
TWIML_APP_SID = "APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"       # TwiML App SID (create in Console)

# Identity of the user (can be anything unique per user)
identity = "TestUser_" + str(int(time.time()))

# Create access token with credentials
token = AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    identity=identity,
    ttl=3600  # 1 hour expiry
)

# Add voice grant with your TwiML App SID
voice_grant = VoiceGrant(
    outgoing_application_sid=TWIML_APP_SID,
    incoming_allow=True
)
token.add_grant(voice_grant)

jwt_token = token.to_jwt()
print("\n✅ COPY THIS TOKEN INTO YOUR REACT APP:\n")
print(jwt_token)
print(f"\n🆔 Token Identity: {identity}")
print(f"⏰ Expires in: 1 hour")