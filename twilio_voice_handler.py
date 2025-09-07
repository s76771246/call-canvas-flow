# Flask backend to handle TwiML voice calls
from flask import Flask, request
from twilio.twiml import VoiceResponse

app = Flask(__name__)

@app.route('/api/twilio/voice', methods=['POST'])
def handle_voice():
    """Handle incoming voice calls and outgoing call routing"""
    response = VoiceResponse()
    
    # Get the phone number being called
    to_number = request.form.get('To')
    from_number = request.form.get('From')
    
    print(f"📞 Voice call: From {from_number} to {to_number}")
    
    if to_number:
        # This is an outgoing call - connect to the target number
        print(f"🔄 Connecting outgoing call to {to_number}")
        dial = response.dial(
            caller_id=from_number,  # Use your Twilio number as caller ID
            timeout=30,             # Ring for 30 seconds
            record=False            # Don't record the call
        )
        dial.number(to_number)
    else:
        # This is an incoming call
        response.say("Hello! This call is being connected.", voice='alice')
    
    return str(response), 200, {'Content-Type': 'text/xml'}

if __name__ == '__main__':
    print("🚀 Starting Twilio Voice Handler on http://localhost:5000")
    print("📋 Use this URL in your TwiML App: http://your-domain.com/api/twilio/voice")
    app.run(debug=True, port=5000)