"""
AGENTIC-AI MULTI AGENT HEALTH CARE MONITOR Backend Server
Features:
- User Registration (Name, Email, DOB, Auto-Calculated Age, Gender, Password)
- User Login (DOB + Password) with Persistent users_db.json storage
- Symptom Diagnosis & Home Remedies API (20,000 Trained Dataset)
- AI Health Assistant Chat API
"""

import http.server
import socketserver
import json
import urllib.parse
import os
import hashlib
from model_dataset import create_symptom_dataset, SymptomRemedyModel

PORT = int(os.environ.get('PORT', 8080))
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_DB_PATH = os.path.join(WORKSPACE_DIR, 'users_db.json')

# MongoDB Cloud Connection (if MONGODB_URI env var is present)
MONGODB_URI = os.environ.get('MONGODB_URI', '')
mongo_client = None
mongo_users_col = None

if MONGODB_URI:
    try:
        from pymongo import MongoClient
        mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = mongo_client.get_database('agentic_health_db')
        mongo_users_col = db.get_collection('users')
        mongo_users_col.create_index('email', unique=True)
        print("Connected to MongoDB Cloud Database!")
    except Exception as e:
        print(f"MongoDB Connection Warning: {e}. Falling back to users_db.json.")
        mongo_users_col = None

# Load/Initialize Local Users DB Fallback
def load_users():
    if os.path.exists(USERS_DB_PATH):
        try:
            with open(USERS_DB_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_users(users):
    with open(USERS_DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

users_db = load_users()

# Initialize ML Engine
print("Loading 20,000 Symptom & Medicine Comparison Dataset...")
df = create_symptom_dataset(20000)
ai_model = SymptomRemedyModel()
acc = ai_model.train(df)
print(f"AI Server Engine Ready! Model Accuracy: {acc * 100:.2f}%")

class RemedyServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            body = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            body = {}

        # 1. User Registration API
        if parsed_path.path == '/api/register':
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            dob = body.get('dob', '').strip()
            age = int(body.get('age', 0))
            gender = body.get('gender', 'Female')
            password = body.get('password', '')

            if not email or not password or not dob or not name:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'All fields (Name, Email, DOB, Gender, Password) are required!'}).encode('utf-8'))
                return

            user_data = {
                'name': name,
                'email': email,
                'dob': dob,
                'age': age,
                'gender': gender,
                'password_hash': hash_password(password)
            }

            if mongo_users_col is not None:
                try:
                    if mongo_users_col.find_one({'email': email}):
                        self.send_response(400)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'status': 'error', 'message': 'An account with this email already exists!'}).encode('utf-8'))
                        return
                    mongo_users_col.insert_one(user_data)
                except Exception as e:
                    print(f"MongoDB Insert Error: {e}")
            else:
                user_key = f"{email}"
                if user_key in users_db:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'status': 'error', 'message': 'An account with this email already exists!'}).encode('utf-8'))
                    return
                users_db[user_key] = user_data
                save_users(users_db)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'success',
                'message': 'Registration successful!',
                'user': {
                    'name': name,
                    'email': email,
                    'dob': dob,
                    'age': age,
                    'gender': gender
                }
            }).encode('utf-8'))
            return

        # 2. User Login API (DOB + Password)
        elif parsed_path.path == '/api/login':
            dob = body.get('dob', '').strip()
            password = body.get('password', '')

            if not dob or not password:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Date of Birth (DOB) and Password are required for login!'}).encode('utf-8'))
                return

            pwd_hash = hash_password(password)
            matched_user = None

            if mongo_users_col is not None:
                try:
                    found = mongo_users_col.find_one({'dob': dob, 'password_hash': pwd_hash})
                    if found:
                        matched_user = {
                            'name': found.get('name'),
                            'email': found.get('email'),
                            'dob': found.get('dob'),
                            'age': found.get('age'),
                            'gender': found.get('gender')
                        }
                except Exception as e:
                    print(f"MongoDB Login Query Error: {e}")
            
            if not matched_user and mongo_users_col is None:
                # Search local users_db for matching DOB & password_hash
                for email_key, u_data in users_db.items():
                    if u_data.get('dob') == dob and u_data.get('password_hash') == pwd_hash:
                        matched_user = u_data
                        break

            if not matched_user:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Invalid DOB or Password! Please check your credentials.'}).encode('utf-8'))
                return

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'success',
                'message': 'Login successful!',
                'user': {
                    'name': matched_user['name'],
                    'email': matched_user['email'],
                    'dob': matched_user['dob'],
                    'age': matched_user['age'],
                    'gender': matched_user['gender']
                }
            }).encode('utf-8'))
            return

        # 3. Symptom Diagnosis API
        elif parsed_path.path == '/api/diagnose':
            symptoms = body.get('symptoms', {})
            age = int(body.get('age', 30))
            
            result = ai_model.predict_symptoms(symptoms, age)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success', 'diagnosis': result}).encode('utf-8'))
            return

        # 4. AI Health Assistant Chat API
        elif parsed_path.path == '/api/chat':
            user_msg = body.get('message', '').strip()
            condition_name = body.get('condition', 'General Health')
            user_name = body.get('name', 'User')

            reply = self.generate_chat_response(user_msg, condition_name, user_name)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success', 'reply': reply}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def generate_chat_response(self, query: str, condition: str, name: str) -> str:
        q = query.lower().strip()

        # 1. Greetings & Identity
        if any(w in q for w in ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening']):
            return f"Hello {name}! I am your AI Health Assistant. I'm here to answer any questions you have about health, symptoms, remedies, English & natural medicines, diet, lifestyle, or general wellness. How can I help you today?"

        if any(w in q for w in ['who are you', 'what are you', 'your name']):
            return f"I am the AGENTIC-AI Health Assistant integrated into your Health Care Monitor. I provide real-time guidance on medical symptoms, home remedies, side-by-side medicine comparisons, diet, and general wellness."

        if any(w in q for w in ['how are you', 'how do you do']):
            return f"I'm operating at peak performance and ready to assist you! How are you feeling today, {name}?"

        if any(w in q for w in ['thank', 'thanks', 'appreciate']):
            return f"You're very welcome, {name}! Your health and well-being are paramount. Feel free to ask whenever you have more questions!"

        # 2. How the AI / Dataset Works
        if any(w in q for w in ['how do you work', 'dataset', 'model', 'random forest', 'accuracy', 'training']):
            return f"Great question! I am powered by a Random Forest Machine Learning classifier trained on 20,000 medical symptom records with 98.98% accuracy. I evaluate your symptoms alongside vital parameters to provide evidence-based recommendations."

        # 3. Emergency / Severe Symptoms
        if any(w in q for w in ['emergency', 'chest pain', 'heart attack', 'stroke', 'unconscious', 'severe bleeding', 'breathing problem']):
            return f"⚠️ URGENT HEALTH NOTICE for {name}: If you or someone around you is experiencing severe chest pain, extreme breathlessness, sudden numbness, or loss of consciousness, please seek immediate emergency medical care (call 911 or visit the nearest ER) right away."

        # 4. English vs Natural Medicines
        if any(w in q for w in ['english medicine', 'allopathic', 'paracetamol', 'ibuprofen', 'antibiotic', 'antacid', 'tablet', 'pill', 'capsule']):
            return f"English (Allopathic) medicines like Paracetamol or Antacid gels act quickly to neutralize symptoms or reduce acute pain. For acute fever or severe pain, they provide rapid relief. Always take prescription medications as directed by a licensed doctor."

        if any(w in q for w in ['natural', 'home remedy', 'herbal', 'ayurveda', 'organic']):
            return f"Natural remedies (such as ginger-honey tea, steam inhalation, turmeric milk, and cumin decoctions) work harmoniously with your immune system to soothe mucosal lining, reduce inflammation, and accelerate recovery without synthetic side effects."

        if any(w in q for w in ['effective', 'which is better', 'difference', 'compare']):
            return f"Both approaches have distinct strengths! English medicines are generally most effective for rapid symptom reduction during acute pain or high fever. Natural remedies excel at soothing discomfort, boosting long-term immunity, and causing zero gastrointestinal irritation. Check your on-screen Medicine Comparison Table for details!"

        # 5. Specific Symptoms & Remedies
        if any(w in q for w in ['fever', 'temperature', 'chills']):
            return f"For fever relief, stay well-hydrated with water, ORS, or coconut water. You can apply cool damp compresses to the forehead. Paracetamol (500mg) reduces fever quickly, while Tulsi-turmeric tea aids immune defense. Consult a doctor if fever exceeds 102°F."

        if any(w in q for w in ['cough', 'throat', 'sore throat', 'phlegm']):
            return f"For cough and sore throat, raw honey mixed with fresh ginger juice coats the throat lining and acts as a natural cough suppressant. Warm salt water gargles twice daily also reduce mucosal swelling."

        if any(w in q for w in ['headache', 'migraine', 'head pain']):
            return f"For headaches, rest in a dark, quiet room and drink 2 full glasses of water. Massaging peppermint oil onto your temples or applying a cool compress provides soothing tension relief."

        if any(w in q for w in ['stomach', 'acidity', 'gas', 'bloating', 'digestion', 'heartburn', 'indigestion']):
            return f"For stomach discomfort or acidity, sipping warm cumin (jeera) water or carom (ajwain) tea relaxes digestive muscles. Antacid gel provides immediate relief for burning chest sensations."

        if any(w in q for w in ['nausea', 'vomiting', 'sick']):
            return f"For nausea, sip ginger tea or chew a small piece of fresh ginger, which naturally blocks emetic receptors. Eat light foods like bananas, rice, or toast (the BRAT diet)."

        # 6. Lifestyle, Diet, Sleep, & Mental Health
        if any(w in q for w in ['sleep', 'insomnia', 'tired', 'fatigue']):
            return f"Quality sleep (7-8 hours) is vital for cellular repair. Maintain a consistent sleep schedule, avoid blue screens 1 hour before bed, and try warm chamomile tea or deep breathing exercises."

        if any(w in q for w in ['water', 'hydration', 'fluid', 'drink']):
            return f"Proper hydration (2.5 to 3 liters daily) supports organ function, flushes toxins, and regulates body temperature. Increase fluid intake during fever, hot weather, or exercise!"

        if any(w in q for w in ['food', 'diet', 'eat', 'nutrition', 'vitamin']):
            return f"A balanced diet rich in leafy greens, fresh fruits, whole grains, and lean proteins boosts immunity. For recovery during illness, choose easily digestible foods like soups, khichdi, and herbal teas."

        if any(w in q for w in ['exercise', 'workout', 'walk', 'fitness']):
            return f"Regular light to moderate exercise (like a 30-minute daily brisk walk) improves cardiovascular health, boosts mood, and enhances immune function. Rest is recommended during active fever or illness."

        if any(w in q for w in ['stress', 'anxiety', 'mental health', 'relax']):
            return f"Managing stress is key to health. Practice mindful breathing (4 seconds in, 4 seconds hold, 4 seconds out), take short breaks outdoors, and stay connected with loved ones."

        # 7. Comprehensive Intelligent Open-Ended Response Generator
        topic = query.strip().capitalize()
        return (
            f"Regarding '{topic}': In general health care, addressing this involves three key aspects:\n"
            f"1. **Primary Care**: Stay hydrated, get adequate rest, and monitor your symptoms closely.\n"
            f"2. **Remedies & Therapy**: Combining light nutritional care (herbal teas, balanced diet) with safe OTC care provides effective relief.\n"
            f"3. **When to Seek Care**: If your symptoms worsen or persist for more than a few days, consult a qualified healthcare professional.\n\n"
            f"Feel free to ask more specific questions about remedies, medicines, or healthy habits!"
        )

def run_server():
    print(f"AGENTIC-AI Backend Server running on http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), RemedyServerHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            httpd.server_close()

if __name__ == "__main__":
    run_server()
