# Email Package + Test App

This repository contains a centralized Email Package and a Test App to demonstrate its usage.

---

## Folder Structure

```
Email/
├─ Email-package/                # The email package
│  ├─ src/
│  │  ├─ emailService/
│  │  ├─ server.js
│  │  └─ ...
│  ├─ db/
│  │  └─ mongoConnection.js
│  └─ package.json
└─ TestApp/                      # Test application to use the email package
   ├─ index.js
   └─ package.json
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

```
POST /api/mail/send
```

**Request Payload Example:**

```json
{
  "to": "rickys@itio.in",
  "template": "welcome",
  "templateData": {"name": "Ricky"},
  "cc": [],
  "bcc": [],
  "attachments": [],
  "source": "gmail"
}
```
**Note:**  the cc, bcc, attachments are still not supported (it is under progress)

⚠️ **Note:** Some SMTP providers may have constraints on the "to" address due to free tier limitations. Adjust the `to` field accordingly.

---

## Features

- **Centralized Email Service**: Reusable email package that can be integrated into multiple applications
- **Template Support**: Dynamic email templates with data interpolation
- **Multiple Recipients**: Support for CC and BCC recipients
- **File Attachments**: Send emails with file attachments
- **Provider Management**: Automatic provider switching and retry logic
- **Hooks System**: Monitoring and custom event handling for email operations
- **Database Integration**: MongoDB integration for provider configuration

---

## Environment Variables

Make sure to create a `.env` file in the **Email-package** directory with the following variables:
(Although .env is intentionally  included for the testing purpose)

```env
MONGO_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/your-database-name
```

---

## Testing with Postman

You can test the API using the provided Postman collection. Import the collection and set the base URL to `http://localhost:4000`.


## Notes

- The package fetches provider credentials from the database
- Hooks are implemented for monitoring email sending, retries, provider switches, and final success/failure
- Ensure MongoDB connection string is correctly set in your `.env` file before running the app
- The retry mechanism automatically switches providers if one fails
- All email operations are logged for debugging and monitoring purposes
  

---


