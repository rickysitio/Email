# Email Package + Test App

This repository contains a centralized Email Package and a Test App to demonstrate its usage.

---

## Folder Structure

```
EMAIL/
├─ README.md                     # Project documentation
├─ Email-package/                # The reusable email package
│  ├─ .env                       # Environment variables
│  ├─ .gitignore
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ db/                        # Database connection
│  ├─ logs/                      # Application logs
│  ├─ node_modules/
│  └─ src/                       # Source code
└─ TestApp/                      # Test application
   ├─ .env                       # Test app environment
   ├─ .gitignore
   ├─ index.js                   # Main server file
   ├─ package-lock.json
   ├─ package.json
   ├─ controllers/               # Route controllers
   ├─ logs/                      # Test app logs
   ├─ node_modules/
   └─ Routes/                    # API routes
```

---

## Setup Instructions

### 1. Install Dependencies for Email Package

Go to the **Email Package** directory first:

```bash
cd Email-package
npm install
```

### 2. Install Dependencies for Test App

Then go to the **Test App** directory:

```bash
cd ../TestApp
npm install
```

### 3. Run the Test App

From the **Test App** directory:

```bash
node index.js
```

The server will start on:

```
http://127.0.0.1:4000
```

---

## API Endpoint

### Send Email
set the base URL to `http://localhost:4000.
```
POST /api/mail/send
```

**Request Payload Example:**


---

## Request Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `multipart/form-data` | Required for file uploads |


---

## Request Body (FormData Fields)

| Field | Type 
|-------|------
| `to` | text 
  `cc`| text
  `bcc`| text
| `template` |text 
| `template data` |text
| `source` | text 
| `attachments` | file 

## Request Body (FormData Fields Example)

| Field | Type
|-------|------
| `to` | rickys@itio.in
|  `cc`| pawneshk@itio.in
| `bcc`| rickysahawork@gmail.com
| `template` |welcome 
| `template data` |{"name": "Ricky","username": "ricky123","regDate": "2025-09-22","promoCode": "WELCOME2025","customMessage": "Enjoy your first month free!","year": "2025"}
| `attachments` | file 
| `source` | gmail 

---
**Currently Supported Providers:**  
    - Gmail  
    - Zoho Mail  
    - MailerSend  
    - SMTP2Go  
    - Elastic Email  
    - Mailgun  
    - Yandex  

⚠️ **Note:** Some SMTP providers may have constraints on the "to" address due to free tier limitations. Adjust the `to` field accordingly.
 ## Provider Constraints & Notes

MailerSend (Trial Account)

Trial accounts can only send emails to the administrator account:
rickysahawork@gmail.com

CC and BCC are not supported under the trial plan.

Mailgun (Trial Account)

Similar to MailerSend, trial accounts are limited to sending only to the administrator account:
rickysahawork@gmail.com

CC and BCC are not supported under the trial plan.

Outlook

Needed OAuth2.0 configuration (only valid with microsoft paid version).
PS:You can check for the retry logic via outlook--> how outlook fails and how it automatically selects another provider for sending the mail.

Other Providers (Gmail, Zoho Mail, SMTP2Go, Elastic Email, Yandex)
**These are working without issues.**

---

## Testing the Email Package

The Email Package includes unit tests to validate its functionality.
```
cd Email-package
npm test
```
### 3. Test Coverage (Current)

✅ ProviderManager

Loads providers from DB

Caching logic (avoids duplicate DB hits within TTL)

Handles provider refresh

Throws error if provider not found

Prevents concurrent initialization

✅ RetryHandler

Retries sending until success

Stops retrying on success

Fails gracefully after max attempts

✅ Mock Providers (Test Utilities)

Fake SMTP provider for isolated testing

No real email is sent, only simulates behavior

✅ sendEmail Flow

Template rendering is mocked and validated

Sends successfully via mock provider

## ✅ Completed Features

- **Centralized Email Package**  
  All services can now use a common package (`sendEmail`) for sending emails.

- **Standardized API**  
  Simple interface: `sendEmail(to, subject, template, data, source)` usable across apps.

- **Provider Management (DB-driven)**  
  - Providers (Gmail, Zoho, ElasticMail, etc.) are fetched from MongoDB.  
  - Cached in memory to avoid redundant DB calls.  
  - Refresh functionality to reload providers.  
  - Prevents concurrent initialization.

- **Retry & Error Handling**  
  - Retries sending emails if a provider fails.  
  - Switches to another provider automatically.  
  - Stops retrying once a provider succeeds.

- **Template Management**  
  - Dynamic template rendering with placeholders (`{{name}}`, `{{username}}`, etc.).  
  - Templates can be reused across services.

- **Attachments, CC & BCC Support**  
  Supports file attachments along with `cc` and `bcc` fields.

- **Logging (Winston)**  
  - Centralized logs stored under `logs/` directory.  
  - Separate monitoring, combined, and error logs.  
  - Useful for debugging and audit trail.

- **Monitoring Hooks**  
  Observability hooks added for:  
  - Send initiation  
  - Retry attempts  
  - Provider switches  
  - Final success/failure

- **Unit Testing (Jest)**  
  - ProviderManager tested for caching, refresh, and error handling.  
  - RetryHandler tested for success/failure retries.  
  - Mock SMTP Providers added for isolated testing.  
  - sendEmail flow tested with mocked template rendering.

- **Security & Config Management**  
  - Credentials stored in DB and `.env`, not hardcoded.  
  - TLS/secure configs supported depending on provider.

- **Scalability Ready**  
  Designed to be easily migrated into a microservice in the future.

## Notes

- The package fetches provider credentials from the database
- Hooks are implemented for monitoring email sending, retries, provider switches, and final success/failure
- Ensure MongoDB connection string is correctly set in your `.env` file before running the app
- The retry mechanism automatically switches providers if one fails
- All email operations are logged for debugging and monitoring purposes
  

---


