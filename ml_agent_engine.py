"""
Multi-Agent Healthcare Monitor Engine
Implements:
1. Healthcare Synthetic Dataset Generator & ML Model Training (Random Forest / Gradient Boosting)
2. Peer-to-Peer (P2P) Architecture
3. Blackboard Architecture
4. Parallel Execution Architecture
5. Sequential / Pipeline Architecture
"""

import numpy as np
import pandas as pd
import time
import asyncio
import json
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

# ==========================================
# 1. SYNTHETIC HEALTHCARE DATASET GENERATOR
# ==========================================

def generate_healthcare_dataset(n_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates realistic synthetic multi-parameter patient vital sign dataset.
    Target Classes:
      0: Normal Baseline
      1: Mild Distress (Elevated HR/BP or minor fever)
      2: Urgent ICU Care (Significant hypoxia, severe arrhythmia, or sepsis sign)
      3: Critical Emergency (Cardiogenic / Septic Shock / Acute Cardiac Event)
    """
    np.random.seed(random_seed)
    
    # Class proportions: Normal 50%, Mild 25%, Urgent 15%, Critical 10%
    n_normal = int(n_samples * 0.50)
    n_mild = int(n_samples * 0.25)
    n_urgent = int(n_samples * 0.15)
    n_critical = n_samples - (n_normal + n_mild + n_urgent)
    
    def generate_records(count, hr_m, hr_s, spo2_m, spo2_s, sbp_m, sbp_s, dbp_m, dbp_s, rr_m, rr_s, temp_m, temp_s, gluc_m, gluc_s, trop_m, trop_s, label):
        return pd.DataFrame({
            'heart_rate': np.clip(np.random.normal(hr_m, hr_s, count), 40, 210),
            'spo2': np.clip(np.random.normal(spo2_m, spo2_s, count), 70, 100),
            'systolic_bp': np.clip(np.random.normal(sbp_m, sbp_s, count), 70, 220),
            'diastolic_bp': np.clip(np.random.normal(dbp_m, dbp_s, count), 40, 130),
            'respiration_rate': np.clip(np.random.normal(rr_m, rr_s, count), 8, 45),
            'body_temp': np.clip(np.random.normal(temp_m, temp_s, count), 35.0, 42.0),
            'blood_glucose': np.clip(np.random.normal(gluc_m, gluc_s, count), 50, 450),
            'troponin_level': np.clip(np.random.normal(trop_m, trop_s, count), 0.0, 15.0),
            'age': np.random.randint(18, 90, count),
            'risk_level': label
        })
    
    df_normal = generate_records(n_normal, 72, 8, 98.5, 1.0, 120, 8, 78, 6, 16, 2, 36.8, 0.3, 95, 12, 0.01, 0.005, 0)
    df_mild = generate_records(n_mild, 95, 12, 95.0, 2.0, 138, 12, 88, 8, 22, 3, 38.2, 0.6, 140, 25, 0.03, 0.01, 1)
    df_urgent = generate_records(n_urgent, 125, 15, 90.0, 3.5, 165, 18, 102, 12, 28, 4, 39.1, 0.8, 220, 50, 0.15, 0.08, 2)
    df_critical = generate_records(n_critical, 155, 22, 82.0, 5.0, 75, 15, 45, 10, 36, 6, 40.2, 1.2, 340, 80, 2.50, 1.20, 3)
    
    df = pd.concat([df_normal, df_mild, df_urgent, df_critical], ignore_index=True)
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df


class HealthcareMLModel:
    """Trains and evaluates Patient Risk Classification model using ML best practices."""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        self.feature_names = [
            'heart_rate', 'spo2', 'systolic_bp', 'diastolic_bp', 
            'respiration_rate', 'body_temp', 'blood_glucose', 'troponin_level', 'age'
        ]
        self.label_map = {0: 'Normal', 1: 'Mild Distress', 2: 'Urgent Care', 3: 'Critical Emergency'}

    def train_and_evaluate(self, df: pd.DataFrame):
        X = df[self.feature_names]
        y = df['risk_level']
        
        # ML Best Practice: Train-Test Split BEFORE fitting scaler
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
        
        # Fit scaler ONLY on X_train
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train RandomForest
        self.model.fit(X_train_scaled, y_train)
        
        # Predict & Evaluate
        y_pred = self.model.predict(X_test_scaled)
        acc = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, target_names=list(self.label_map.values()), output_dict=True)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        feature_importances = dict(zip(self.feature_names, self.model.feature_importances_.round(4)))
        
        return {
            'accuracy': float(acc),
            'classification_report': report,
            'confusion_matrix': cm,
            'feature_importances': feature_importances
        }

    def predict_patient(self, vital_dict: Dict[str, float]) -> Dict[str, Any]:
        features = np.array([[vital_dict.get(f, 0.0) for f in self.feature_names]])
        features_scaled = self.scaler.transform(features)
        pred_class = int(self.model.predict(features_scaled)[0])
        probabilities = self.model.predict_proba(features_scaled)[0].tolist()
        
        return {
            'risk_code': pred_class,
            'risk_label': self.label_map[pred_class],
            'confidence': float(probabilities[pred_class]),
            'probabilities': {self.label_map[i]: float(p) for i, p in enumerate(probabilities)}
        }


# ==========================================
# 2. ARCHITECTURE 1: PEER-TO-PEER (P2P) AGENTS
# ==========================================

@dataclass
class P2PMessage:
    sender: str
    recipient: str
    content: str
    timestamp: float = field(default_factory=time.time)

class SpecialistAgentP2P:
    """Specialist Medical Agent (Cardiologist, Pulmonologist, Endocrinologist, Neurologist)"""
    def __init__(self, name: str, specialty: str):
        self.name = name
        self.specialty = specialty
        self.inbox: List[P2PMessage] = []
        self.peers: Dict[str, 'SpecialistAgentP2P'] = {}
        self.execution_log: List[Dict[str, Any]] = []

    def connect_peer(self, peer: 'SpecialistAgentP2P'):
        self.peers[peer.name] = peer

    def send_message(self, recipient_name: str, content: str):
        if recipient_name in self.peers:
            msg = P2PMessage(sender=self.name, recipient=recipient_name, content=content)
            self.peers[recipient_name].inbox.append(msg)
            self.execution_log.append({
                'action': 'SENT',
                'to': recipient_name,
                'content': content
            })

    def evaluate_and_dialogue(self, vitals: Dict[str, float]) -> List[Dict[str, Any]]:
        logs = []
        # Pulmonologist evaluation
        if self.specialty == 'Pulmonology':
            if vitals['spo2'] < 90:
                logs.append({'agent': self.name, 'thought': f"Hypoxia detected (SpO2={vitals['spo2']}%). Requesting Cardiac impact check."})
                self.send_message('CardiologistAgent', f"High hypoxia SpO2={vitals['spo2']}%. Is heart rate compensated?")
        
        # Cardiologist evaluation
        elif self.specialty == 'Cardiology':
            if vitals['heart_rate'] > 120 or vitals['troponin_level'] > 0.1:
                logs.append({'agent': self.name, 'thought': f"Cardiac stress! HR={vitals['heart_rate']} bpm, Troponin={vitals['troponin_level']} ng/mL."})
                self.send_message('EndocrinologistAgent', f"Tachycardia detected. Check glucose/metabolic drive.")
        
        # Process inbox messages directly (P2P negotiation)
        while self.inbox:
            msg = self.inbox.pop(0)
            logs.append({'agent': self.name, 'received_p2p_msg': f"From {msg.sender}: {msg.content}"})
            if 'hypoxia' in msg.content.lower() and self.specialty == 'Cardiology':
                reply = f"Heart Rate is {vitals['heart_rate']} bpm. Risk of ischemic cardiac strain high!"
                logs.append({'agent': self.name, 'reply': reply})
            elif 'tachycardia' in msg.content.lower() and self.specialty == 'Endocrinology':
                reply = f"Blood glucose is {vitals['blood_glucose']} mg/dL. Metabolic shock factor evaluated."
                logs.append({'agent': self.name, 'reply': reply})
        
        return logs

class P2PSystem:
    def __init__(self):
        self.cardio = SpecialistAgentP2P("CardiologistAgent", "Cardiology")
        self.pulmo = SpecialistAgentP2P("PulmonologistAgent", "Pulmonology")
        self.endo = SpecialistAgentP2P("EndocrinologistAgent", "Endocrinology")
        
        # Connect P2P Mesh network
        self.cardio.connect_peer(self.pulmo)
        self.cardio.connect_peer(self.endo)
        self.pulmo.connect_peer(self.cardio)
        self.pulmo.connect_peer(self.endo)
        self.endo.connect_peer(self.cardio)
        self.endo.connect_peer(self.pulmo)

    def run(self, vitals: Dict[str, float]) -> List[Dict[str, Any]]:
        trace = []
        trace.extend(self.pulmo.evaluate_and_dialogue(vitals))
        trace.extend(self.cardio.evaluate_and_dialogue(vitals))
        trace.extend(self.endo.evaluate_and_dialogue(vitals))
        return trace


# ==========================================
# 3. ARCHITECTURE 2: BLACKBOARD ARCHITECTURE
# ==========================================

class Blackboard:
    """Central Shared Memory Board holding patient telemetry, hypothesis state, and active tags."""
    def __init__(self):
        self.patient_vitals: Dict[str, float] = {}
        self.knowledge_entries: List[Dict[str, Any]] = []
        self.diagnostic_conclusions: List[str] = []
        self.alert_level: str = "GREEN"

    def write_entry(self, source_agent: str, category: str, data: Any):
        entry = {
            'timestamp': time.strftime("%H:%M:%S"),
            'source': source_agent,
            'category': category,
            'data': data
        }
        self.knowledge_entries.append(entry)
        if category == "ALERT":
            self.alert_level = data.get('level', self.alert_level)
            self.diagnostic_conclusions.append(data.get('message', ''))

    def get_entries(self) -> List[Dict[str, Any]]:
        return self.knowledge_entries

class BlackboardKnowledgeSource:
    """Independent Agent triggered by updates on the shared Blackboard."""
    def __init__(self, name: str, trigger_category: str):
        self.name = name
        self.trigger_category = trigger_category

    def execute(self, blackboard: Blackboard) -> Optional[Dict[str, Any]]:
        pass

class VitalIngestionKS(BlackboardKnowledgeSource):
    def __init__(self):
        super().__init__("VitalIngestionKS", "TELEMETRY")

    def execute(self, blackboard: Blackboard, vitals: Dict[str, float]):
        blackboard.patient_vitals = vitals
        blackboard.write_entry(self.name, "TELEMETRY", f"Ingested {len(vitals)} vital sign indicators.")

class CardiacHypothesisKS(BlackboardKnowledgeSource):
    def __init__(self):
        super().__init__("CardiacHypothesisKS", "ANALYSIS")

    def execute(self, blackboard: Blackboard):
        vitals = blackboard.patient_vitals
        if vitals.get('troponin_level', 0) > 0.1 or (vitals.get('heart_rate', 0) > 130 and vitals.get('systolic_bp', 0) < 90):
            blackboard.write_entry(self.name, "ALERT", {
                'level': 'RED',
                'message': f"HYPOTHESIS: High Cardiac Ischemia / Cardiogenic Shock risk. Troponin: {vitals.get('troponin_level')}"
            })

class RespiratoryHypothesisKS(BlackboardKnowledgeSource):
    def __init__(self):
        super().__init__("RespiratoryHypothesisKS", "ANALYSIS")

    def execute(self, blackboard: Blackboard):
        vitals = blackboard.patient_vitals
        if vitals.get('spo2', 100) < 88 and vitals.get('respiration_rate', 0) > 30:
            blackboard.write_entry(self.name, "ALERT", {
                'level': 'ORANGE',
                'message': f"HYPOTHESIS: Severe Respiratory Distress (SpO2={vitals.get('spo2')}%, RR={vitals.get('respiration_rate')})"
            })

class BlackboardCoordinatorSystem:
    def __init__(self):
        self.blackboard = Blackboard()
        self.ingestion = VitalIngestionKS()
        self.cardiac_ks = CardiacHypothesisKS()
        self.pulmo_ks = RespiratoryHypothesisKS()

    def run(self, vitals: Dict[str, float]) -> Dict[str, Any]:
        self.blackboard = Blackboard()
        self.ingestion.execute(self.blackboard, vitals)
        self.cardiac_ks.execute(self.blackboard)
        self.pulmo_ks.execute(self.blackboard)
        
        return {
            'alert_level': self.blackboard.alert_level,
            'conclusions': self.blackboard.diagnostic_conclusions,
            'blackboard_history': self.blackboard.get_entries()
        }


# ==========================================
# 4. ARCHITECTURE 3: PARALLEL EXECUTION AGENTS
# ==========================================

class ChannelWorkerAgent:
    """Processes specific physiological data channels in parallel."""
    def __init__(self, channel_name: str):
        self.channel_name = channel_name

    async def analyze(self, vitals: Dict[str, float]) -> Dict[str, Any]:
        start_time = time.perf_counter()
        # Simulate asynchronous processing latency
        await asyncio.sleep(0.01)
        
        if self.channel_name == "CARDIOVASCULAR":
            hr = vitals.get('heart_rate', 70)
            sbp = vitals.get('systolic_bp', 120)
            score = 0
            if hr > 110 or hr < 50: score += 2
            if sbp > 140 or sbp < 90: score += 2
            result = {"channel": "Cardiovascular", "score": score, "status": "ABNORMAL" if score >= 2 else "NORMAL"}

        elif self.channel_name == "RESPIRATORY":
            spo2 = vitals.get('spo2', 98)
            rr = vitals.get('respiration_rate', 16)
            score = 0
            if spo2 < 92: score += 3
            if rr > 24 or rr < 10: score += 2
            result = {"channel": "Respiratory", "score": score, "status": "ABNORMAL" if score >= 2 else "NORMAL"}

        elif self.channel_name == "METABOLIC_LABS":
            gluc = vitals.get('blood_glucose', 100)
            trop = vitals.get('troponin_level', 0.01)
            score = 0
            if gluc > 200 or gluc < 60: score += 2
            if trop > 0.1: score += 4
            result = {"channel": "MetabolicLabs", "score": score, "status": "CRITICAL" if score >= 4 else ("ABNORMAL" if score >= 2 else "NORMAL")}

        elapsed = (time.perf_counter() - start_time) * 1000
        result['latency_ms'] = round(elapsed, 2)
        return result

class ParallelExecutionSystem:
    def __init__(self):
        self.workers = [
            ChannelWorkerAgent("CARDIOVASCULAR"),
            ChannelWorkerAgent("RESPIRATORY"),
            ChannelWorkerAgent("METABOLIC_LABS")
        ]

    async def run_parallel(self, vitals: Dict[str, float]) -> Dict[str, Any]:
        start_total = time.perf_counter()
        # Execute workers concurrently using asyncio.gather
        results = await asyncio.gather(*[worker.analyze(vitals) for worker in self.workers])
        total_time_ms = round((time.perf_counter() - start_total) * 1000, 2)
        
        max_score = max(r['score'] for r in results)
        summary_status = "STABLE" if max_score < 2 else ("URGENT" if max_score < 4 else "CRITICAL EMERGENCY")
        
        return {
            'execution_mode': 'Parallel Async Threads',
            'channel_results': results,
            'total_latency_ms': total_time_ms,
            'summary_status': summary_status
        }


# ==========================================
# 5. ARCHITECTURE 4: SEQUENTIAL / PIPELINE
# ==========================================

class PipelineStage:
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

class IngestionStage(PipelineStage):
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        data['stage_1_ingest'] = {
            'timestamp': time.time(),
            'validated_keys': list(data['vitals'].keys()),
            'status': 'PASSED'
        }
        return data

class FeatureEngineeringStage(PipelineStage):
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        v = data['vitals']
        # Compute shock index = HR / SBP
        sbp = max(v.get('systolic_bp', 120), 1)
        shock_index = round(v.get('heart_rate', 70) / sbp, 2)
        # Pulse pressure = SBP - DBP
        pulse_pressure = v.get('systolic_bp', 120) - v.get('diastolic_bp', 80)
        
        data['stage_2_features'] = {
            'shock_index': shock_index,
            'pulse_pressure': pulse_pressure,
            'status': 'PASSED'
        }
        return data

class MLInferenceStage(PipelineStage):
    def __init__(self, ml_model: HealthcareMLModel):
        self.ml_model = ml_model

    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        pred = self.ml_model.predict_patient(data['vitals'])
        data['stage_3_ml_inference'] = pred
        return data

class ClinicalTriageStage(PipelineStage):
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        ml_res = data['stage_3_ml_inference']
        risk_code = ml_res['risk_code']
        
        triage_category = {
            0: "Level 5 - Non-Urgent Baseline",
            1: "Level 4 - Semi-Urgent Monitor",
            2: "Level 2 - Emergency Department Priority",
            3: "Level 1 - Resuscitation / Immediate ICU"
        }[risk_code]
        
        data['stage_4_triage'] = {
            'triage_category': triage_category,
            'assigned_team': "ICU Rapid Response Team" if risk_code >= 2 else "Floor Nurse Monitoring",
            'status': 'PASSED'
        }
        return data

class ActionDispatchStage(PipelineStage):
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        risk_code = data['stage_3_ml_inference']['risk_code']
        actions = []
        if risk_code == 3:
            actions.append("DISPATCH: Code Red Emergency Alert Sent to Attending Physician & Crash Cart")
            actions.append("MEDICATION: Stat Oxygen Therapy & Intravenous Access Initiated")
        elif risk_code == 2:
            actions.append("DISPATCH: Urgent Cardiology / ICU Consult Requested")
        else:
            actions.append("MONITOR: Continue 15-minute Vital Telemetry Logging")
            
        data['stage_5_action_dispatch'] = {
            'dispatched_actions': actions,
            'status': 'COMPLETED'
        }
        return data

class SequentialPipelineSystem:
    def __init__(self, ml_model: HealthcareMLModel):
        self.stages = [
            IngestionStage(),
            FeatureEngineeringStage(),
            MLInferenceStage(ml_model),
            ClinicalTriageStage(),
            ActionDispatchStage()
        ]

    def execute_pipeline(self, vitals: Dict[str, float]) -> Dict[str, Any]:
        payload = {'vitals': vitals}
        pipeline_trace = []
        for idx, stage in enumerate(self.stages, 1):
            stage_name = stage.__class__.__name__
            t0 = time.perf_counter()
            payload = stage.process(payload)
            dt = round((time.perf_counter() - t0) * 1000, 3)
            pipeline_trace.append({
                'step': idx,
                'stage': stage_name,
                'execution_time_ms': dt,
                'stage_data': payload[f'stage_{idx}_' + ['ingest', 'features', 'ml_inference', 'triage', 'action_dispatch'][idx-1]]
            })
        
        return {
            'pipeline_trace': pipeline_trace,
            'final_triage': payload['stage_4_triage'],
            'final_actions': payload['stage_5_action_dispatch']
        }


# ==========================================
# 6. DEMO EXECUTION
# ==========================================

def main():
    print("=" * 60)
    print(" [HEALTHCARE] MULTI-AGENT HEALTHCARE MONITOR SYSTEM")
    print("=" * 60)
    
    # 1. Generate Dataset & Train ML Model
    print("\n1. Generating Healthcare Dataset & Training ML Model...")
    dataset = generate_healthcare_dataset(5000)
    ml_system = HealthcareMLModel()
    results = ml_system.train_and_evaluate(dataset)
    print(f"   Model Accuracy: {results['accuracy'] * 100:.2f}%")
    print("   Feature Importances:", results['feature_importances'])
    
    # Critical Test Case
    sample_critical_vitals = {
        'heart_rate': 145.0,
        'spo2': 84.0,
        'systolic_bp': 80.0,
        'diastolic_bp': 50.0,
        'respiration_rate': 32.0,
        'body_temp': 39.5,
        'blood_glucose': 290.0,
        'troponin_level': 1.85,
        'age': 65
    }
    
    print("\n" + "=" * 60)
    print(" TESTING CRITICAL PATIENT SCENARIO ACROSS ALL 4 ARCHITECTURES")
    print("=" * 60)
    
    # 2. Peer-to-Peer Execution
    print("\n--- ARCHITECTURE 1: PEER-TO-PEER (P2P) ---")
    p2p_sys = P2PSystem()
    p2p_logs = p2p_sys.run(sample_critical_vitals)
    for log in p2p_logs:
        print("  [P2P Log]", log)

    # 3. Blackboard Architecture Execution
    print("\n--- ARCHITECTURE 2: BLACKBOARD ARCHITECTURE ---")
    bb_sys = BlackboardCoordinatorSystem()
    bb_res = bb_sys.run(sample_critical_vitals)
    print(f"   Alert Level: {bb_res['alert_level']}")
    for conc in bb_res['conclusions']:
        print("   Conclusion:", conc)

    # 4. Parallel Execution Architecture
    print("\n--- ARCHITECTURE 3: PARALLEL EXECUTION ARCHITECTURE ---")
    par_sys = ParallelExecutionSystem()
    par_res = asyncio.run(par_sys.run_parallel(sample_critical_vitals))
    print(f"   Summary Status: {par_res['summary_status']} (Total Latency: {par_res['total_latency_ms']} ms)")
    for chan in par_res['channel_results']:
        print(f"   Worker [{chan['channel']}]: Status={chan['status']}, Score={chan['score']}, Latency={chan['latency_ms']} ms")

    # 5. Sequential / Pipeline Architecture Execution
    print("\n--- ARCHITECTURE 4: SEQUENTIAL / PIPELINE ARCHITECTURE ---")
    seq_sys = SequentialPipelineSystem(ml_system)
    seq_res = seq_sys.execute_pipeline(sample_critical_vitals)
    for step in seq_res['pipeline_trace']:
        print(f"   Step {step['step']} [{step['stage']}]: {step['execution_time_ms']} ms -> {step['stage_data']}")
        
    print("\n" + "=" * 60)
    print(" DEMO COMPLETED SUCCESSFULLY")
    print("=" * 60)

if __name__ == "__main__":
    main()
