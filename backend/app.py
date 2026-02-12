
import numpy as np
import cv2
import base64
import os
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from simple_salesforce import Salesforce, SalesforceLogin, SalesforceAuthenticationFailed

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Constants
PROTOTXT = "MobileNetSSD_deploy.prototxt"
MODEL = "MobileNetSSD_deploy.caffemodel"

CLASSES = ["background", "aeroplane", "bicycle", "bird", "boat", "bottle", "bus", "car", "cat", "chair", "cow", "diningtable", "dog", "horse", "motorbike", "person", "pottedplant", "sheep", "sofa", "train", "tvmonitor"]
COLORS = np.random.uniform(0, 255, size=(len(CLASSES), 3))

# Initialize net if possible
net = None
if os.path.exists(PROTOTXT) and os.path.exists(MODEL):
    print("Loading model from files...")
    net = cv2.dnn.readNetFromCaffe(PROTOTXT, MODEL)
else:
    print(f"Warning: Model files not found. Please place {PROTOTXT} and {MODEL} in the backend directory.")

# Salesforce Configuration
SF_USERNAME = os.environ.get('SF_USERNAME')
SF_PASSWORD = os.environ.get('SF_PASSWORD')
SF_SECURITY_TOKEN = os.environ.get('SF_SECURITY_TOKEN')
SF_DOMAIN = os.environ.get('SF_DOMAIN', 'login') # login or test

def get_salesforce_client():
    if not all([SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN]):
        return None
    try:
        sf = Salesforce(username=SF_USERNAME, password=SF_PASSWORD, security_token=SF_SECURITY_TOKEN, domain=SF_DOMAIN)
        return sf
    except Exception as e:
        print(f"Salesforce Connection Error: {e}")
        return None

# Simulation Data for Plate Detection (Deterministic for easier DUPLICATE logic demonstration)
# We will rotate through this list to ensure we generate "duplicates" to test the logic.
MOCK_PLATES = [
    f"MH-12-AB-{random.randint(1000, 1005)}" for _ in range(5)
]

def generate_plate_number():
    return random.choice(MOCK_PLATES)

def save_to_salesforce(detections, sf_client):
    """
    Saves detections to Salesforce Vehicle_Detection__c object.
    Prevents duplicates by checking if the same Plate Number was logged today.
    """
    if not sf_client:
        return {"error": "Salesforce missing credentials"}

    saved_count = 0
    errors = []

    for detection in detections:
        plate = detection.get('plate')
        label = detection.get('label')
        
        # Only save vehicles with plates
        if not plate or plate == "N/A":
            continue

        try:
            # 1. Duplication Check
            # Query if this plate was already logged TODAY
            # SOQL Injection safe-guarding: plate is generated internally or should be sanitized if user input
            query = f"SELECT Id FROM Vehicle_Detection__c WHERE License_Plate__c = '{plate}' AND CreatedDate = TODAY LIMIT 1"
            result = sf_client.query(query)

            if result['totalSize'] > 0:
                print(f"Skipping duplicate plate: {plate}")
                continue # Skip existing

            # 2. Create Record
            # Assumes a Custom Object 'Vehicle_Detection__c' exists with these fields.
            data = {
                'License_Plate__c': plate,
                'Vehicle_Type__c': label,
                'Confidence__c': detection.get('confidence'),
                'Detection_Time__c': detection.get('time') or 'Now'
            }
            sf_client.Vehicle_Detection__c.create(data)
            saved_count += 1
            print(f"Saved to Salesforce: {plate}")

        except Exception as e:
            print(f"Error saving {plate}: {e}")
            errors.append(str(e))
    
    return {"saved": saved_count, "errors": errors}


@app.route('/detect', methods=['POST'])
def detect_objects():
    if not net:
        return jsonify({'error': 'Model not loaded. Please check server logs.'}), 500

    data = request.json
    if not data or 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400

    # Check if user wants to save to Salesforce
    should_save_to_sf = data.get('save_to_salesforce', False)

    image_data = data['image']
    # If base64 encoded
    if image_data.startswith('data:image'):
        header, encoded = image_data.split(",", 1)
        decoded_data = base64.b64decode(encoded)
        np_arr = np.frombuffer(decoded_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    else:
        return jsonify({'error': 'Invalid image format'}), 400
    
    if frame is None:
        return jsonify({'error': 'Could not decode image'}), 400

    h, w = frame.shape[:2]
    
    detections_list = []
    
    blob = cv2.dnn.blobFromImage(frame, 0.007843, (300, 300), (127.5, 127.5, 127.5), swapRB=False)
    net.setInput(blob)
    detections = net.forward()

    for i in np.arange(0, detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        
        # Debug high confidence issues
        if confidence > 1.0:
            print(f"Warning: Raw confidence > 1.0 detected: {confidence}. Clamping.")
            
        # Clamp confidence to [0, 1] range to avoid UI bugs
        confidence = min(max(float(confidence), 0.0), 1.0)

        if confidence > 0.5:
            idx = int(detections[0, 0, i, 1])
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            (startX, startY, endX, endY) = box.astype("int")
            
            # Additional bounds check for box coordinates
            startX = max(0, startX)
            startY = max(0, startY)
            endX = min(w, endX)
            endY = min(h, endY)

            label = CLASSES[idx]
            
            # Simulated OCR
            plate_text = "N/A"
            if label in ["car", "bus", "motorbike"]:
                plate_text = generate_plate_number()

            detections_list.append({
                "label": label,
                "confidence": float(confidence),
                "box": [int(startX), int(startY), int(endX), int(endY)],
                "plate": plate_text
            })

    # Salesforce Logic
    sf_status = "Skipped"
    if should_save_to_sf:
        sf_client = get_salesforce_client()
        if sf_client:
            sf_result = save_to_salesforce(detections_list, sf_client)
            sf_status = sf_result
        else:
            sf_status = "Credentials Missing"

    return jsonify({
        "detections": detections_list,
        "salesforce_status": sf_status
    })

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "message": "Vehicle Detection API is running. Use /detect endpoint to process images.",
        "model_loaded": net is not None
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model_loaded": net is not None})

if __name__ == '__main__':
    # Using port 3000 for the API
    app.run(host='0.0.0.0', port=3000)
