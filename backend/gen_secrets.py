"""Generate secret keys for production deployment."""

import secrets
import base64
import os


def main():
    print("═" * 60)
    print("  Pramaan — Secret Key Generator")
    print("═" * 60)
    print()
    print("Add these to your .env file:\n")

    app_secret = secrets.token_urlsafe(48)
    jwt_secret = secrets.token_urlsafe(48)
    file_enc_key = secrets.token_urlsafe(32)
    authority_token = secrets.token_urlsafe(32)

    print(f"APP_SECRET_KEY={app_secret}")
    print(f"JWT_SECRET={jwt_secret}")
    print(f"FILE_ENC_KEY={file_enc_key}")
    print(f"AUTHORITY_SIM_TOKEN={authority_token}")
    print()
    print("⚠️  Never commit these to version control!")


if __name__ == "__main__":
    main()
