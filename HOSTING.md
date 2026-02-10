
# HOSTING GUIDE

## 1. Environment Setup

### Backend Environment Variables
When hosting the backend (e.g., on Render, Heroku, or AWS), you MUST set these environment variables:

```bash
SF_USERNAME=your_salesforce_email@example.com
SF_PASSWORD=your_salesforce_password
SF_SECURITY_TOKEN=your_security_token
SF_DOMAIN=login  # Use 'test' for Sandbox, 'login' for Production/Dev Edition
```

### Frontend Environment Variables
When hosting the frontend (e.g., on Vercel), set this variable:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com/detect
```

## 2. Salesforce Setup

1.  **Create Custom Object**:
    *   Go to Salesforce Setup -> Object Manager -> Create -> Custom Object.
    *   Label: `Vehicle Detection`
    *   Plural Label: `Vehicle Detections`
    *   Object Name: `Vehicle_Detection` (API Name will be `Vehicle_Detection__c`)

2.  **Create Custom Fields**:
    *   **License Plate**: Text(20) -> API Name: `License_Plate__c` (Mark as External ID / Unique if you want strict DB uniqueness, though the code handles check-before-create).
    *   **Vehicle Type**: Text(20) -> API Name: `Vehicle_Type__c`
    *   **Confidence**: Number(3, 2) -> API Name: `Confidence__c`
    *   **Detection Time**: Text(50) -> API Name: `Detection_Time__c`

## 3. Deployment Steps

### Backend (Render.com Recommended)
1.  Push code to GitHub.
2.  Create New Web Service on Render.
3.  Select your repo.
4.  Root Directory: `backend`.
5.  Environment: `Python 3`.
6.  Build Command: `pip install -r requirements.txt && python download_model.py`.
7.  Start Command: `python app.py`.
8.  **Important**: Go to "Environment" tab and add the SF_* variables listed above.

### Frontend (Vercel)
1.  Push code to GitHub.
2.  Import project in Vercel.
3.  Root Directory: `frontend`.
4.  Add `NEXT_PUBLIC_API_URL` to the Environment Variables.
5.  Deploy.
