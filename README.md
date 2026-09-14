# 🏥 AGENTIC-AI MULTI AGENT HEALTH CARE MONITOR

An advanced Agentic AI system and Machine Learning training studio for real-time patient vital monitoring, clinical triage, and emergency response across four foundational multi-agent software architectures: **Peer-to-Peer (P2P)**, **Blackboard Shared Memory**, **Parallel Async Execution**, and **Sequential Pipeline**.

---

## 🌟 Key Features & Architecture Breakdown

### 1. Training Dataset & ML Fine-Tuning Studio (Tab 6)
- **5,000 Patient Synthetic Dataset**: View, search, filter, and inspect training records across 9 clinical vital sign features (`Heart Rate`, `SpO2`, `Systolic BP`, `Diastolic BP`, `Respiration Rate`, `Body Temp`, `Blood Glucose`, `Troponin Level`, `Age`).
- **One-Click CSV Export**: Download the complete 5,000-sample dataset directly from the web interface.
- **Interactive Model Retraining**: Adjust hyperparameters (`Estimators / Trees`, `Max Depth`, `Train/Test Ratio`, `Random Seed`) and retrain the Random Forest ML model with real-time accuracy updates, 4x4 confusion matrix grid, and feature importance bar meters.

### 2. Autonomous Agentic AI Tool-Calling Engine (ReAct Framework)
- The AI Agent operates using a **Perceive ➔ Thought ➔ Tool Call ➔ Act ➔ Reflect** loop:
  - `dataset_stats_lookup`: Queries historical vital benchmarks in the 5,000-patient dataset.
  - `compute_shock_index`: Computes Shock Index ($HR / SBP$) & Pulse Pressure.
  - `predict_risk_ml`: Runs trained Random Forest ML decision paths.
  - `organ_pathology_evaluator`: Evaluates organ distress across Heart, Lungs, Pancreas/Metabolic, Brain.
  - `subagent_specialist_consult`: Dispatches sub-agent mesh (Cardiology, Pulmonology, Endocrinology).
  - `dispatch_clinical_triage`: Issues priority level and dispatches hospital alerts.

### 3. 4 Core Multi-Agent Architectures
- **Peer-to-Peer (P2P)**: Specialist agents negotiate directly over message queues.
- **Blackboard Shared Memory**: Central shared memory updated asynchronously by knowledge sources.
- **Parallel Async Execution**: Multi-channel worker agents process telemetry concurrently with sub-millisecond latency.
- **Sequential Pipeline**: Deterministic 5-stage processing pipeline.

---

## 🚀 How to Run

### Option A: Python REST Server & Web App Mode (Recommended)
```bash
# Clone/Navigate to workspace
cd "e:/AGENTIC AI"

# Run Python REST Server (Serves Web Dashboard + API on http://localhost:8080)
python server.py
```
- Open your browser at: `http://localhost:8080`

### Option B: Local Engine Script
```bash
python ml_agent_engine.py
```

---

## 📁 Repository File Structure

```
e:/AGENTIC AI/
├── Healthcare_MultiAgent_Monitor.ipynb # Google Colab Notebook
├── ml_agent_engine.py                  # Core Python ML & Agentic Engine
├── server.py                           # Python HTTP REST Backend Server (Port 8080)
├── index.html                          # Web Dashboard HTML5 layout
├── styles.css                          # Dark Glassmorphism CSS design system
├── app.js                              # Web Application interactive logic engine
└── README.md                           # Project documentation
```

---
*Developed for Agentic AI Healthcare Monitoring Systems.*
