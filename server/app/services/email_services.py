import httpx
from app.core.config import BREVO_API_KEY, SENDER_EMAIL

class EmailService:
    @staticmethod
    async def send_otp_email(recipient_email: str, otp_code: str):
        """
        Sends an asynchronous email using Brevo's REST API via httpx.
        """
        if not BREVO_API_KEY or not SENDER_EMAIL:
            print("⚠️ EMAIL ABORTED: Brevo API credentials missing.")
            return

        # 1. The Brevo API Endpoint
        url = "https://api.brevo.com/v3/smtp/email"

        # 2. The Authentication Headers
        headers = {
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json"
        }

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #333;">Welcome to Clarix!</h2>
                    <p style="color: #555; font-size: 16px;">Please use the following 6-digit code to verify your email address:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #4F46E5; letter-spacing: 5px; margin: 0;">{otp_code}</h1>
                    </div>
                </div>
            </body>
        </html>
        """

        # 3. The JSON Payload (This is what the SDK would build behind the scenes)
        payload = {
            "sender": {"email": SENDER_EMAIL, "name": "Clarix Security"},
            "to": [{"email": recipient_email}],
            "subject": "Your Clarix Verification Code",
            "htmlContent": html_content
        }

        # 4. Dispatch the API request asynchronously
        try:
            # httpx.AsyncClient() is the non-blocking engine
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload)
                
                # Brevo returns 201 Created on success
                if response.status_code in [200, 201]:
                    print(f"✅ OTP Email successfully sent via Brevo API to {recipient_email}")
                else:
                    print(f"❌ Brevo API Error: {response.text}")
                    
        except Exception as e:
            print(f"❌ Network failure while sending email: {str(e)}")

    
    
    @staticmethod
    async def send_password_reset_email(recipient_email: str, otp_code: str):
        """
        Sends an asynchronous password reset email via Brevo.
        """
        if not BREVO_API_KEY or not SENDER_EMAIL:
            print("⚠️ EMAIL ABORTED: Brevo API credentials missing.")
            return

        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json"
        }

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p style="color: #555; font-size: 16px;">We received a request to reset the password for your Clarix account. Use the code below to proceed:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #EF4444; letter-spacing: 5px; margin: 0;">{otp_code}</h1>
                    </div>
                    <p style="color: #888; font-size: 14px;">This code expires in 15 minutes. If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
                </div>
            </body>
        </html>
        """

        payload = {
            "sender": {"email": SENDER_EMAIL, "name": "Clarix Security"},
            "to": [{"email": recipient_email}],
            "subject": "Clarix Password Reset Code",
            "htmlContent": html_content
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code in [200, 201]:
                    print(f"✅ Password Reset Email sent to {recipient_email}")
                else:
                    print(f"❌ Brevo API Error: {response.text}")
        except Exception as e:
            print(f"❌ Network failure while sending email: {str(e)}")