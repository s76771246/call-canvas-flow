/**
 * Generate Twilio Access Token
 * Since the Twilio SDK can't run in the browser, you have two options:
 * 
 * Option 1: Use your backend endpoint (recommended)
 * Option 2: Use a hardcoded token for testing
 */
export const generateTwilioToken = async (): Promise<string> => {
  try {
    // Option 1: Fetch token from your backend (uncomment and update URL)
    /*
    const response = await fetch('/api/twilio/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identity: 'user_123' })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch token from backend');
    }
    
    const data = await response.json();
    return data.token;
    */
    
    // Option 2: For testing - paste your backend-generated token here
    // Replace this with the actual JWT token from your Python backend
    const hardcodedToken = "PASTE_YOUR_JWT_TOKEN_HERE";
    
    if (hardcodedToken === "PASTE_YOUR_JWT_TOKEN_HERE") {
      throw new Error('Please either set up backend endpoint or paste your JWT token');
    }
    
    console.log('Using hardcoded token for testing');
    return hardcodedToken;
    
  } catch (error) {
    console.error('Error getting Twilio token:', error);
    throw new Error('Failed to get Twilio token');
  }
};
