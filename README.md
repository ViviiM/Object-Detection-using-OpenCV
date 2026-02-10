
# Vehicle Detection Web & Mobile App

This project converts your OpenCV Python script into a full-stack web application with a responsive UI and a dedicated backend for processing images.

## Project Structure

- **frontend/**: A Next.js application that handles the UI, Camera access, and displays results.
- **backend/**: A Python Flask API that runs the OpenCV MobileNetSSD model.

## Prerequisites

- Node.js (v18+)
- Python (v3.9+)

## Quick Start (Run Locally)

### 1. Backend Setup (Terminal 1)
The backend runs the object detection model.

```bash
cd backend
# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download the model files (MobileNetSSD_deploy.prototxt & .caffemodel)
python download_model.py

# Run the server
python app.py
```
Server will start on `http://localhost:5000`.

### 2. Frontend Setup (Terminal 2)
The frontend provides the UI for the camera.

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

## Deployment Guide

### Frontend (User Interface)
The frontend is a Next.js app and is best deployed on **Vercel**.

1. Push your code to GitHub.
2. Go to [Vercel](https://vercel.com) -> "Add New Project".
3. Import your repository.
4. Set the `Root Directory` to `frontend`.
5. Deploy.

### Backend (Object Detection Model)
Because OpenCV and Caffe models are large and require specific system libraries, **Vercel Serverless Functions** are generally NOT suitable (due to size limits).

**Recommended: Docker Deployment (Render, Railway, or AWS)**

I have included a `Dockerfile` in the `backend/` folder. You can deploy this easily to services like Render.com:

1. Push code to GitHub.
2. Go to [Render](https://render.com).
3. Create a **New Web Service**.
4. Connect your GitHub repo.
5. set **Root Directory** to `backend`.
6. Render will automatically detect the `Dockerfile` and build it.
7. Once deployed, get your Backend URL (e.g., `https://my-api.onrender.com`).
8.Update `frontend/app/page.tsx` line 26 with your new backend URL:
   ```javascript
   const response = await axios.post("https://my-api.onrender.com/detect", ...);
   ```

## Salesforce Integration

To integrate with Salesforce:
1. In `backend/app.py`, implement the `save_to_salesforce` function.
2. Use the `simple_salesforce` Python library (`pip install simple_salesforce`).
3. Authenticate and push the `detections_list` to your custom object.

## Features

- **Real-time Detection**: Uses `react-webcam` to capture frames.
- **Responsive UI**: Works on Desktop and Mobile (Tailwind CSS).
- **Visualization**: Draws bounding boxes on the canvas overlay.
- **Mock Plate Detection**: Generates random plate numbers for cars (placeholder for real OCR).
