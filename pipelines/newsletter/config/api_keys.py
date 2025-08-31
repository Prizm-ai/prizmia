"""
Secure API key management
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_api_key(key_name: str) -> str:
    """Get API key from environment variables"""
    key = os.getenv(key_name)
    if not key:
        raise ValueError(f"API key {key_name} not found in environment variables")
    return key

def validate_api_keys() -> dict:
    """Validate all required API keys"""
    required_keys = {
        'OPENAI_API_KEY': 'OpenAI API',
        'EMAIL_FROM': 'Email From',
        'SMTP_PASSWORD': 'SMTP Password'
    }
    
    status = {}
    for key, description in required_keys.items():
        try:
            value = get_api_key(key)
            status[key] = "Available"
        except ValueError:
            status[key] = "Missing"
    
    return status

if __name__ == "__main__":
    print("Validation des cles API:")
    status = validate_api_keys()
    for key, state in status.items():
        print(f"  {key}: {state}")

