"""
Comprehensive Symptom, Remedy & Dual-Medicine Comparison AI Engine
------------------------------------------------------------------
Trains on 20,000 Dataset Records mapping 14+ symptoms to conditions,
home remedies, and side-by-side English vs Natural Medicine comparisons.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

EXPANDED_SYMPTOMS = [
    'fever', 'cough', 'headache', 'fatigue', 'stomach_pain', 'sore_throat',
    'nausea', 'cold_runny_nose', 'body_ache', 'acidity_heartburn',
    'diarrhea', 'dizziness', 'skin_rash', 'chest_pain'
]

CONDITIONS_MAP = {
    0: {
        'name': 'Common Cold & Upper Respiratory Infection',
        'severity': 'Mild (Home Care)',
        'remedies': [
            'Drink warm ginger-honey tea 2-3 times daily to soothe throat irritation.',
            'Perform steam inhalation with eucalyptus oil for 5-10 minutes.',
            'Maintain high hydration with warm water and herbal soups.',
            'Gargle with warm salt water twice daily.'
        ],
        'doctor_advice': 'Consult a physician if fever stays above 102°F or cold lasts over 7 days.',
        'medicine_table': [
            {
                'symptom_target': 'Nasal Congestion & Runny Nose',
                'english_medicine': 'Cetirizine / Decongestant (OTC)',
                'natural_medicine': 'Steam Inhalation + Eucalyptus Oil',
                'most_effective': 'Natural Medicine (Steam Inhalation)',
                'rationale': 'Steam clears sinuses naturally without drowsiness or rebound nasal congestion.'
            },
            {
                'symptom_target': 'Sore Throat & Cough',
                'english_medicine': 'Dextromethorphan Cough Syrup',
                'natural_medicine': 'Raw Honey + Ginger Juice (1 tsp)',
                'most_effective': 'Natural Medicine (Honey + Ginger)',
                'rationale': 'Raw honey coats the throat mucosa, providing superior cough suppression compared to syrups.'
            },
            {
                'symptom_target': 'Mild Body Ache & Low Fever',
                'english_medicine': 'Paracetamol / Acetaminophen (500mg)',
                'natural_medicine': 'Tulsi & Turmeric Warm Milk',
                'most_effective': 'English Medicine (Paracetamol)',
                'rationale': 'Paracetamol acts rapidly to reduce fever and systemic aches within 30-45 minutes.'
            }
        ]
    },
    1: {
        'name': 'Viral Fever & General Body Fatigue',
        'severity': 'Moderate (Rest Required)',
        'remedies': [
            'Ensure complete bed rest and minimize physical exertion.',
            'Drink ORS (Oral Rehydration Solution) or fresh coconut water.',
            'Apply cool damp compresses to the forehead for temperature control.',
            'Eat soft, light foods like khichdi or warm soup.'
        ],
        'doctor_advice': 'Seek medical evaluation if fever persists beyond 3 days or if severe vomiting occurs.',
        'medicine_table': [
            {
                'symptom_target': 'High Fever Reduction',
                'english_medicine': 'Paracetamol (650mg)',
                'natural_medicine': 'Cool Water Compress + Giloy Juice',
                'most_effective': 'English Medicine (Paracetamol 650mg)',
                'rationale': 'Essential for fast, reliable fever reduction to prevent febrile complications.'
            },
            {
                'symptom_target': 'Weakness & Dehydration',
                'english_medicine': 'Electrolyte Packets (ORS)',
                'natural_medicine': 'Fresh Coconut Water & Rice Kanji',
                'most_effective': 'Both Equally Effective',
                'rationale': 'Coconut water provides bio-available potassium while ORS balances sodium electrolytes.'
            },
            {
                'symptom_target': 'Immune Boosting & Recovery',
                'english_medicine': 'Vitamin C & Zinc Supplements',
                'natural_medicine': 'Amla (Indian Gooseberry) & Turmeric',
                'most_effective': 'Natural Medicine (Amla & Turmeric)',
                'rationale': 'Whole food plant antioxidants enhance cellular immunity without stomach irritation.'
            }
        ]
    },
    2: {
        'name': 'Gastritis, Acidity & Indigestion Upset',
        'severity': 'Mild to Moderate',
        'remedies': [
            'Sip warm cumin (jeera) water or fennel (saunf) tea after meals.',
            'Drink fresh cold milk or plain buttermilk with roasted cumin.',
            'Avoid spicy, fried, acidic, and caffeinated beverages.',
            'Maintain an upright posture for 30 minutes after eating.'
        ],
        'doctor_advice': 'Consult a gastroenterologist if experiencing severe abdominal cramps, vomiting blood, or dark stool.',
        'medicine_table': [
            {
                'symptom_target': 'Acid Reflux & Heartburn',
                'english_medicine': 'Pantoprazole / Antacid Gel (Gelusil)',
                'natural_medicine': 'Cold Milk / Cumin (Jeera) Decoction',
                'most_effective': 'English Medicine (Antacid Gel)',
                'rationale': 'Neutralizes excess stomach acid immediately for fast relief from burning chest sensation.'
            },
            {
                'symptom_target': 'Bloating & Stomach Gas',
                'english_medicine': 'Simethicone Drops / Tablets',
                'natural_medicine': 'Fennel Seeds (Saunf) + Carom (Ajwain)',
                'most_effective': 'Natural Medicine (Ajwain + Saunf)',
                'rationale': 'Ajwain contains thymol which stimulates digestive enzymes and dispels gas naturally.'
            },
            {
                'symptom_target': 'Nausea & Stomach Cramps',
                'english_medicine': 'Ondansetron / Dicyclomine',
                'natural_medicine': 'Peppermint Tea or Ginger Juice',
                'most_effective': 'Natural Medicine (Ginger Juice)',
                'rationale': 'Gingerol blocks emetic receptors in the stomach without central nervous system sedation.'
            }
        ]
    },
    3: {
        'name': 'Tension Headache & Migraine Stress',
        'severity': 'Mild (Self-Manageable)',
        'remedies': [
            'Apply a cold ice pack or warm heating pad to your forehead/neck for 15 mins.',
            'Rest in a dark, silent room away from screens and bright lights.',
            'Gently massage temples with diluted peppermint oil.',
            'Drink 2 full glasses of room-temperature water.'
        ],
        'doctor_advice': 'Seek emergency care if headache is sudden ("thunderclap") or accompanied by numbness or slurred speech.',
        'medicine_table': [
            {
                'symptom_target': 'Acute Throbbing Headache',
                'english_medicine': 'Ibuprofen (400mg) / Aspirin',
                'natural_medicine': 'Peppermint Oil Temple Massage',
                'most_effective': 'English Medicine (Ibuprofen)',
                'rationale': 'Inhibits prostaglandin synthesis to relieve vascular headache pain in 20-30 minutes.'
            },
            {
                'symptom_target': 'Stress & Muscle Tension',
                'english_medicine': 'Muscle Relaxant / Mild Sedative',
                'natural_medicine': 'Chamomile Tea + Breathing Exercises',
                'most_effective': 'Natural Medicine (Chamomile Tea)',
                'rationale': 'Promotes natural relaxation without risk of dependency or morning grogginess.'
            }
        ]
    },
    4: {
        'name': 'Emergency Warning (Urgent Medical Evaluation Required)',
        'severity': 'High (Medical Care Required)',
        'remedies': [
            'Rest comfortably in a seated position.',
            'Avoid physical exertion and keep emergency medical contacts ready.'
        ],
        'doctor_advice': '⚠️ URGENT: Chest pain or severe breathlessness requires immediate emergency medical evaluation!',
        'medicine_table': [
            {
                'symptom_target': 'Acute Chest Pain / Cardiac Strain',
                'english_medicine': 'Aspirin (300mg) / Sublingual Nitroglycerin',
                'natural_medicine': 'Immediate Seated Rest & Oxygenation',
                'most_effective': 'English Medicine (Aspirin - Stat Dose)',
                'rationale': 'Emergency antiplatelet action is critical; seek immediate ambulance dispatch.'
            }
        ]
    }
}

def create_symptom_dataset(n_samples: int = 20000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    data = []
    
    for _ in range(n_samples):
        age = np.random.randint(12, 85)
        r = np.random.rand()
        
        if r < 0.35:
            cond = 0 # Cold
            fever = np.random.choice([0, 1], p=[0.4, 0.6])
            cough = 1
            headache = np.random.choice([0, 1], p=[0.5, 0.5])
            fatigue = np.random.choice([0, 1], p=[0.3, 0.7])
            stomach_pain = 0
            sore_throat = 1
            nausea = 0
            cold_runny_nose = 1
            body_ache = np.random.choice([0, 1], p=[0.5, 0.5])
            acidity = 0
            diarrhea = 0
            dizziness = 0
            skin_rash = 0
            chest_pain = 0
        elif r < 0.60:
            cond = 1 # Viral Fever
            fever = 1
            cough = np.random.choice([0, 1], p=[0.5, 0.5])
            headache = 1
            fatigue = 1
            stomach_pain = 0
            sore_throat = np.random.choice([0, 1], p=[0.5, 0.5])
            nausea = np.random.choice([0, 1], p=[0.7, 0.3])
            cold_runny_nose = np.random.choice([0, 1], p=[0.5, 0.5])
            body_ache = 1
            acidity = 0
            diarrhea = np.random.choice([0, 1], p=[0.8, 0.2])
            dizziness = np.random.choice([0, 1], p=[0.6, 0.4])
            skin_rash = 0
            chest_pain = 0
        elif r < 0.80:
            cond = 2 # Gastritis
            fever = 0
            cough = 0
            headache = 0
            fatigue = np.random.choice([0, 1], p=[0.5, 0.5])
            stomach_pain = 1
            sore_throat = 0
            nausea = 1
            cold_runny_nose = 0
            body_ache = 0
            acidity = 1
            diarrhea = np.random.choice([0, 1], p=[0.6, 0.4])
            dizziness = 0
            skin_rash = 0
            chest_pain = 0
        elif r < 0.95:
            cond = 3 # Tension Headache
            fever = 0
            cough = 0
            headache = 1
            fatigue = 1
            stomach_pain = 0
            sore_throat = 0
            nausea = 0
            cold_runny_nose = 0
            body_ache = np.random.choice([0, 1], p=[0.5, 0.5])
            acidity = 0
            diarrhea = 0
            dizziness = np.random.choice([0, 1], p=[0.5, 0.5])
            skin_rash = 0
            chest_pain = 0
        else:
            cond = 4 # Emergency
            fever = 0
            cough = 0
            headache = 0
            fatigue = 1
            stomach_pain = 0
            sore_throat = 0
            nausea = 0
            cold_runny_nose = 0
            body_ache = 0
            acidity = 0
            diarrhea = 0
            dizziness = 1
            skin_rash = 0
            chest_pain = 1

        data.append({
            'fever': fever, 'cough': cough, 'headache': headache, 'fatigue': fatigue,
            'stomach_pain': stomach_pain, 'sore_throat': sore_throat, 'nausea': nausea,
            'cold_runny_nose': cold_runny_nose, 'body_ache': body_ache,
            'acidity_heartburn': acidity, 'diarrhea': diarrhea, 'dizziness': dizziness,
            'skin_rash': skin_rash, 'chest_pain': chest_pain, 'age': age, 'condition': cond
        })
        
    df = pd.DataFrame(data)
    df.to_csv('symptom_dataset_20k.csv', index=False)
    return df

class SymptomRemedyModel:
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
        self.feature_cols = EXPANDED_SYMPTOMS + ['age']

    def train(self, df: pd.DataFrame):
        X = df[self.feature_cols]
        y = df['condition']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        self.model.fit(X_train_scaled, y_train)
        y_pred = self.model.predict(X_test_scaled)
        acc = accuracy_score(y_test, y_pred)
        return float(acc)

    def predict_symptoms(self, symptoms_dict: dict, age: int = 30):
        input_data = [symptoms_dict.get(s, 0) for s in EXPANDED_SYMPTOMS] + [age]
        features_scaled = self.scaler.transform([input_data])
        
        pred_code = int(self.model.predict(features_scaled)[0])
        probabilities = self.model.predict_proba(features_scaled)[0].tolist()
        
        details = CONDITIONS_MAP.get(pred_code, CONDITIONS_MAP[0])
        return {
            'condition_code': pred_code,
            'condition_name': details['name'],
            'severity': details['severity'],
            'remedies': details['remedies'],
            'doctor_advice': details['doctor_advice'],
            'medicine_table': details['medicine_table'],
            'confidence': float(probabilities[pred_code])
        }

if __name__ == "__main__":
    df = create_symptom_dataset(20000)
    model = SymptomRemedyModel()
    acc = model.train(df)
    print(f"Symptom AI Model Trained! Accuracy: {acc*100:.2f}%")
