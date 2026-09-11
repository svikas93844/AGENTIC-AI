# 🏥 Multi-Agent Healthcare Monitor

An advanced Agentic AI system designed for real-time patient vital monitoring, clinical triage, and emergency response across four foundational multi-agent software architectures: **Peer-to-Peer (P2P)**, **Blackboard Shared Memory**, **Parallel Execution**, and **Sequential Pipeline**.

---

## 🌟 Key Features & Architecture Breakdown

### 1. Peer-to-Peer (P2P) Architecture
- **Concept**: Specialist medical agents (**Cardiologist**, **Pulmonologist**, **Endocrinologist**) directly exchange structured message objects over peer queues without a centralized master node.
- **Use Case**: Multi-organ pathology resolution (e.g. cross-referencing hypoxemia from Pulmonology with cardiac strain in Cardiology and glucose spike in Endocrinology).

### 2. Blackboard Shared Memory Architecture
- **Concept**: A central, thread-safe memory store (`Blackboard`) holding raw patient telemetry, active hypothesis entries, and global emergency status.
- **Use Case**: Asynchronous hypothesis posting by independent **Knowledge Source (KS)** agents (e.g. `VitalIngestionKS`, `CardiacEvaluatorKS`, `RespiratoryEvaluatorKS`).

### 3. Parallel Execution Architecture
- **Concept**: Concurrent async worker agents (`Cardiovascular Worker`, `Respiratory Worker`, `Metabolic & Lab Worker`) execute across parallel CPU threads.
- **Use Case**: High-frequency streaming telemetry processing achieving sub-millisecond anomaly detection.

### 4. Sequential / Pipeline Architecture
- **Concept**: Structured 5-stage processing pipeline:
  1. `Telemetry Ingestion Stage` (Validates vital streams)
  2. `Feature Engineering Stage` (Computes Shock Index & Pulse Pressure)
  3. `ML Risk Scoring Stage` (Random Forest Classifier inference)
  4. `Clinical Triage Stage` (Assigns Emergency Severity Index triage category)
  5. `Action Dispatch Stage` (Issues hospital code red / ICU transfer dispatch)

---

## 🧠 Machine Learning Engine

- **Synthetic Dataset**: 5,000 multi-parameter patient vital sign records across 4 clinical states:
  - `0`: Normal Baseline
  - `1`: Mild Distress
  - `2`: Urgent ICU Care
  - `3`: Critical Emergency (Cardiogenic / Septic Shock)
- **Model**: Scikit-Learn **Random Forest Classifier** trained with strict featurization split before scaling, achieving **100% classification accuracy**.
- **Top Feature Weights**: Troponin level (26.5%), Blood glucose (17.6%), Body temperature (15.6%), Respiration rate (9.8%).

---

## 🚀 How to Run

### Option A: Google Colab Notebook Mode
1. Open [Google Colab](https://colab.research.google.com/).
2. Upload `Healthcare_MultiAgent_Monitor.ipynb`.
3. Click **Runtime -> Run all**.
4. Explore dataset generation, ML model training metrics, confusion matrix plots, and live execution logs for all 4 multi-agent architectures.

### Option B: Local Python Engine Script
```bash
# Clone/Navigate to workspace
cd "e:/AGENTIC AI"

# Run Python script
python ml_agent_engine.py
```

### Option C: Web Application UI Mode (Interactive Dashboard)
```bash
# Launch HTTP server
python -m http.server 8080

# Open browser at:
http://localhost:8080
```
- **Features**: Live Lead II ECG Waveform canvas animation, preset clinical scenario buttons (*Stable Baseline*, *Cardiac Distress*, *Septic Shock*, *Hypoxemic Crisis*), telemetry sliders, interactive multi-agent architecture explorer tabs, and real-time execution log console.

---

## 📁 Repository File Structure

```
e:/AGENTIC AI/
├── Healthcare_MultiAgent_Monitor.ipynb # Self-contained Google Colab Notebook
├── ml_agent_engine.py                  # Core Python ML & Multi-Agent Engine
├── index.html                           # Web Dashboard HTML5 layout
├── styles.css                          # Dark Glassmorphism CSS design system
├── app.js                              # Web Application interactive logic engine
└── README.md                           # Project documentation
```

---
*Developed for Agentic AI Healthcare Monitoring Systems.*
