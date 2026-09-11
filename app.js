/**
 * Multi-Agent Healthcare Monitor Engine (JavaScript Web Application Mode)
 * Implements:
 * 1. Interactive Patient Onboarding & Registration (Name, Age, Patient ID, Symptoms)
 * 2. Real-Time Anatomical Organ Distress Scanner Animation
 * 3. 4 Core Multi-Agent Architectures (P2P, Blackboard, Parallel, Sequential Pipeline)
 * 4. Patient AI Specialist Consultation & Q&A Portal (Tab 5)
 */

document.addEventListener('DOMContentLoaded', () => {
    // State Management
    const state = {
        patient: {
            name: 'Sarah Jenkins',
            age: 58,
            gender: 'Female',
            id: 'PAT-2026-9042',
            symptoms: 'Sudden onset chest tightness, difficulty breathing, and cold sweats.'
        },
        vitals: {
            heart_rate: 148,
            spo2: 89,
            systolic_bp: 82,
            diastolic_bp: 53,
            respiration_rate: 28,
            body_temp: 37.4,
            blood_glucose: 185,
            troponin_level: 2.15
        },
        activeArchTab: 'p2p',
        currentScenario: 'cardiac'
    };

    // DOM Elements
    const elements = {
        // Admission Modal & Form
        admissionModal: document.getElementById('admissionModal'),
        admissionForm: document.getElementById('admissionForm'),
        openAdmissionBtn: document.getElementById('openAdmissionBtn'),
        patientNameInput: document.getElementById('patientName'),
        patientAgeInput: document.getElementById('patientAge'),
        patientGenderInput: document.getElementById('patientGender'),
        patientSymptomsInput: document.getElementById('patientSymptoms'),
        modalScenarioPills: document.querySelectorAll('.scenario-pill'),

        // Header Display Badges
        dispPatientName: document.getElementById('disp-patient-name'),
        dispPatientId: document.getElementById('disp-patient-id'),
        dispPatientAge: document.getElementById('disp-patient-age'),
        dispPatientSymptoms: document.getElementById('disp-patient-symptoms'),
        sidebarSymptomsText: document.getElementById('sidebar-symptoms-text'),
        chatPatientName: document.getElementById('chat-patient-name'),

        // Sliders
        sliderHr: document.getElementById('slider-hr'),
        sliderSpo2: document.getElementById('slider-spo2'),
        sliderSbp: document.getElementById('slider-sbp'),
        sliderRr: document.getElementById('slider-rr'),
        sliderTemp: document.getElementById('slider-temp'),
        sliderGlucose: document.getElementById('slider-glucose'),
        sliderTroponin: document.getElementById('slider-troponin'),

        // Slider Value Labels
        valHr: document.getElementById('val-hr'),
        valSpo2: document.getElementById('val-spo2'),
        valSbp: document.getElementById('val-sbp'),
        valRr: document.getElementById('val-rr'),
        valTemp: document.getElementById('val-temp'),
        valGlucose: document.getElementById('val-glucose'),
        valTroponin: document.getElementById('val-troponin'),

        // Vital Cards
        cardHr: document.getElementById('card-hr'),
        cardSpo2: document.getElementById('card-spo2'),
        cardBp: document.getElementById('card-bp'),
        cardTemp: document.getElementById('card-temp'),
        cardValHr: document.getElementById('card-val-hr'),
        cardValSpo2: document.getElementById('card-val-spo2'),
        cardValBp: document.getElementById('card-val-bp'),
        cardValTemp: document.getElementById('card-val-temp'),

        // Organ Scanner Nodes
        organHeart: document.getElementById('organ-heart'),
        organLungs: document.getElementById('organ-lungs'),
        organPancreas: document.getElementById('organ-pancreas'),
        organBrain: document.getElementById('organ-brain'),
        tagHeart: document.getElementById('tag-heart'),
        tagLungs: document.getElementById('tag-lungs'),
        tagPancreas: document.getElementById('tag-pancreas'),
        tagBrain: document.getElementById('tag-brain'),
        organScannerStatus: document.getElementById('organ-scanner-status'),

        // Status Badges & ML Box
        triageStatusBadge: document.getElementById('triage-status-badge'),
        activeArchBadge: document.getElementById('active-arch-badge'),
        mlRiskResult: document.getElementById('ml-risk-result'),
        mlConfidence: document.getElementById('ml-confidence'),
        pbar0: document.getElementById('pbar-0'),
        pbar1: document.getElementById('pbar-1'),
        pbar2: document.getElementById('pbar-2'),
        pbar3: document.getElementById('pbar-3'),

        // Console & Buttons
        consoleLogs: document.getElementById('console-logs'),
        runAgentsBtn: document.getElementById('run-agents-btn'),
        clearConsoleBtn: document.getElementById('clear-console-btn'),

        // Tabs & Q&A
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabPanes: document.querySelectorAll('.tab-pane'),
        p2pMsgFeed: document.getElementById('p2p-msg-feed'),
        blackboardBody: document.getElementById('blackboard-entries-body'),
        bbAlertFlag: document.getElementById('bb-alert-flag'),
        qaForm: document.getElementById('qaForm'),
        qaInput: document.getElementById('qaInput'),
        qaChatWindow: document.getElementById('qaChatWindow'),
        chipBtns: document.querySelectorAll('.chip-btn')
    };

    // ==========================================
    // 1. PATIENT ADMISSION & REGISTRATION FLOW
    // ==========================================
    function generatePatientID() {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        return `PAT-2026-${randNum}`;
    }

    elements.openAdmissionBtn.addEventListener('click', () => {
        elements.admissionModal.classList.add('active');
    });

    elements.modalScenarioPills.forEach(pill => {
        pill.addEventListener('click', () => {
            elements.modalScenarioPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.currentScenario = pill.getAttribute('data-scenario');
        });
    });

    elements.admissionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        state.patient.name = elements.patientNameInput.value.trim() || 'John Doe';
        state.patient.age = parseInt(elements.patientAgeInput.value) || 50;
        state.patient.gender = elements.patientGenderInput.value;
        state.patient.symptoms = elements.patientSymptomsInput.value.trim() || 'Chest tightness and shortness of breath';
        state.patient.id = generatePatientID();

        // Update UI displays
        elements.dispPatientName.innerText = state.patient.name;
        elements.dispPatientId.innerText = state.patient.id;
        elements.dispPatientAge.innerText = `Age ${state.patient.age} (${state.patient.gender})`;
        elements.dispPatientSymptoms.innerText = state.patient.symptoms.substring(0, 30) + '...';
        elements.sidebarSymptomsText.innerText = state.patient.symptoms;
        if (elements.chatPatientName) elements.chatPatientName.innerText = state.patient.name;

        // Apply selected scenario presets
        applyScenarioPreset(state.currentScenario);

        // Hide Modal
        elements.admissionModal.classList.remove('active');
        logConsole(`\n[HOSPITAL ADMISSION] Confirmed Patient ID: ${state.patient.id} for ${state.patient.name}, Age ${state.patient.age}.`, 'log-alert');
    });

    const scenarioPresets = {
        cardiac: { heart_rate: 148, spo2: 89, systolic_bp: 82, respiration_rate: 28, body_temp: 37.4, blood_glucose: 185, troponin_level: 2.15 },
        sepsis: { heart_rate: 135, spo2: 85, systolic_bp: 78, respiration_rate: 34, body_temp: 40.2, blood_glucose: 280, troponin_level: 0.45 },
        hypoxia: { heart_rate: 115, spo2: 78, systolic_bp: 145, respiration_rate: 38, body_temp: 38.1, blood_glucose: 140, troponin_level: 0.08 },
        stable: { heart_rate: 72, spo2: 98, systolic_bp: 120, respiration_rate: 16, body_temp: 36.8, blood_glucose: 95, troponin_level: 0.01 }
    };

    function applyScenarioPreset(scKey) {
        const data = scenarioPresets[scKey];
        if (data) {
            elements.sliderHr.value = data.heart_rate;
            elements.sliderSpo2.value = data.spo2;
            elements.sliderSbp.value = data.systolic_bp;
            elements.sliderRr.value = data.respiration_rate;
            elements.sliderTemp.value = data.body_temp;
            elements.sliderGlucose.value = data.blood_glucose;
            elements.sliderTroponin.value = data.troponin_level;
            updateVitalsFromUI();
        }
    }

    // ==========================================
    // 2. LIVE REAL-TIME TELEMETRY & ORGAN SCANNER
    // ==========================================
    function updateVitalsFromUI() {
        state.vitals.heart_rate = parseFloat(elements.sliderHr.value);
        state.vitals.spo2 = parseFloat(elements.sliderSpo2.value);
        state.vitals.systolic_bp = parseFloat(elements.sliderSbp.value);
        state.vitals.diastolic_bp = Math.round(state.vitals.systolic_bp * 0.65);
        state.vitals.respiration_rate = parseFloat(elements.sliderRr.value);
        state.vitals.body_temp = parseFloat(elements.sliderTemp.value);
        state.vitals.blood_glucose = parseFloat(elements.sliderGlucose.value);
        state.vitals.troponin_level = parseFloat(elements.sliderTroponin.value);

        // Slider Labels
        elements.valHr.innerText = `${state.vitals.heart_rate} bpm`;
        elements.valSpo2.innerText = `${state.vitals.spo2} %`;
        elements.valSbp.innerText = `${state.vitals.systolic_bp} mmHg`;
        elements.valRr.innerText = `${state.vitals.respiration_rate} /min`;
        elements.valTemp.innerText = `${state.vitals.body_temp} °C`;
        elements.valGlucose.innerText = `${state.vitals.blood_glucose} mg/dL`;
        elements.valTroponin.innerText = `${state.vitals.troponin_level} ng/mL`;

        // Vital Cards Display
        elements.cardValHr.innerText = state.vitals.heart_rate;
        elements.cardValSpo2.innerText = state.vitals.spo2;
        elements.cardValBp.innerText = `${state.vitals.systolic_bp}/${state.vitals.diastolic_bp}`;
        elements.cardValTemp.innerText = state.vitals.body_temp;

        // Card Glow Animations
        elements.cardHr.className = `vital-card ${state.vitals.heart_rate > 120 || state.vitals.troponin_level > 0.1 ? 'card-pulse-danger' : ''}`;
        elements.cardSpo2.className = `vital-card ${state.vitals.spo2 < 90 ? 'card-pulse-danger' : (state.vitals.spo2 < 95 ? 'card-pulse-warning' : '')}`;
        elements.cardBp.className = `vital-card ${state.vitals.systolic_bp < 90 || state.vitals.systolic_bp > 160 ? 'card-pulse-danger' : ''}`;

        // Update Organ Scanner Animation
        updateOrganScanner();

        // Evaluate ML Risk Model
        evaluateMLModel();
    }

    function updateOrganScanner() {
        const v = state.vitals;
        let targetedOrgans = [];

        // Heart Node
        if (v.heart_rate > 120 || v.troponin_level > 0.1 || v.systolic_bp < 90) {
            elements.organHeart.className = 'organ-node active-organ';
            elements.tagHeart.className = 'organ-tag tag-critical';
            elements.tagHeart.innerText = v.troponin_level > 0.1 ? 'ISCHEMIA RISK' : 'TACHYCARDIA';
            targetedOrgans.push('Heart');
        } else {
            elements.organHeart.className = 'organ-node';
            elements.tagHeart.className = 'organ-tag tag-normal';
            elements.tagHeart.innerText = 'NORMAL';
        }

        // Lungs Node
        if (v.spo2 < 92 || v.respiration_rate > 24) {
            elements.organLungs.className = 'organ-node active-organ';
            elements.tagLungs.className = 'organ-tag tag-urgent';
            elements.tagLungs.innerText = v.spo2 < 88 ? 'SEVERE HYPOXIA' : 'RESP DISTRESS';
            targetedOrgans.push('Lungs');
        } else {
            elements.organLungs.className = 'organ-node';
            elements.tagLungs.className = 'organ-tag tag-normal';
            elements.tagLungs.innerText = 'PERFUSED';
        }

        // Metabolic / Glucose Node
        if (v.blood_glucose > 200 || v.body_temp > 39.0) {
            elements.organPancreas.className = 'organ-node active-organ';
            elements.tagPancreas.className = 'organ-tag tag-urgent';
            elements.tagPancreas.innerText = v.blood_glucose > 200 ? 'HYPERGLYCEMIC' : 'FEVER SPIKE';
            targetedOrgans.push('Metabolic');
        } else {
            elements.organPancreas.className = 'organ-node';
            elements.tagPancreas.className = 'organ-tag tag-normal';
            elements.tagPancreas.innerText = 'STABLE';
        }

        // Brain Node
        if (v.systolic_bp < 85 || v.spo2 < 82) {
            elements.organBrain.className = 'organ-node active-organ';
            elements.tagBrain.className = 'organ-tag tag-critical';
            elements.tagBrain.innerText = 'HYPOPERFUSION';
            targetedOrgans.push('Brain');
        } else {
            elements.organBrain.className = 'organ-node';
            elements.tagBrain.className = 'organ-tag tag-normal';
            elements.tagBrain.innerText = 'PERFUSED';
        }

        elements.organScannerStatus.innerText = targetedOrgans.length > 0 ? `Distress: ${targetedOrgans.join(', ')}` : 'Systemic Baseline Normal';
    }

    // Attach slider listeners
    [elements.sliderHr, elements.sliderSpo2, elements.sliderSbp, elements.sliderRr,
     elements.sliderTemp, elements.sliderGlucose, elements.sliderTroponin].forEach(slider => {
        slider.addEventListener('input', updateVitalsFromUI);
    });

    // ==========================================
    // 3. ML MODEL RISK EVALUATOR
    // ==========================================
    function evaluateMLModel() {
        const v = state.vitals;
        let score = 0;

        if (v.heart_rate > 120 || v.heart_rate < 50) score += 2;
        if (v.spo2 < 92) score += 3;
        if (v.systolic_bp < 90 || v.systolic_bp > 160) score += 2;
        if (v.troponin_level > 0.15) score += 4;
        if (v.body_temp > 39.0 || v.body_temp < 35.5) score += 2;
        if (v.blood_glucose > 250) score += 2;

        let riskLabel = "NORMAL BASELINE";
        let triageClass = "status-normal";
        let probs = [95, 3, 1, 1];

        if (score >= 7) {
            riskLabel = "CRITICAL EMERGENCY";
            triageClass = "status-critical";
            probs = [1, 4, 10, 85];
        } else if (score >= 4) {
            riskLabel = "URGENT ICU CARE";
            triageClass = "status-urgent";
            probs = [3, 12, 75, 10];
        } else if (score >= 2) {
            riskLabel = "MILD DISTRESS";
            triageClass = "status-mild";
            probs = [15, 75, 8, 2];
        }

        elements.mlRiskResult.innerText = riskLabel;
        elements.mlRiskResult.className = `pred-result ${score >= 7 ? 'status-critical-text' : ''}`;

        elements.triageStatusBadge.innerText = riskLabel;
        elements.triageStatusBadge.className = `pill-status ${triageClass}`;

        elements.pbar0.style.width = `${probs[0]}%`;
        elements.pbar1.style.width = `${probs[1]}%`;
        elements.pbar2.style.width = `${probs[2]}%`;
        elements.pbar3.style.width = `${probs[3]}%`;

        return { score, riskLabel, probs };
    }

    // ==========================================
    // 4. MULTI-AGENT ARCHITECTURES SIMULATOR
    // ==========================================
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            elements.tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`pane-${tabId}`).classList.add('active');

            state.activeArchTab = tabId;
            elements.activeArchBadge.innerText = btn.innerText.replace(/^\d+\.\s*/, '');
        });
    });

    function runP2PSimulation() {
        const v = state.vitals;
        elements.p2pMsgFeed.innerHTML = '';

        const logs = [];
        logs.push(`[P2P Specialist Mesh Active] Pulmonologist, Cardiologist, Endocrinologist initialized.`);

        if (v.spo2 < 90) {
            logs.push(`[Pulmonologist -> Cardiologist]: "Patient ${state.patient.name} has severe hypoxia SpO2=${v.spo2}%. Check cardiac output."`);
        }
        if (v.heart_rate > 120 || v.troponin_level > 0.1) {
            logs.push(`[Cardiologist -> Endocrinologist]: "Elevated Troponin ${v.troponin_level} ng/mL & HR ${v.heart_rate} bpm. Assess metabolic shock risk."`);
        }
        if (v.blood_glucose > 200) {
            logs.push(`[Endocrinologist -> Pulmonologist]: "Hyperglycemia ${v.blood_glucose} mg/dL detected. Monitor respiratory compensation."`);
        }
        if (logs.length === 1) {
            logs.push(`[P2P Negotiation]: All specialist agents report normal vital baseline for ${state.patient.name}.`);
        }

        logs.forEach(logText => {
            const div = document.createElement('div');
            div.className = 'p2p-msg';
            div.innerText = logText;
            elements.p2pMsgFeed.appendChild(div);
            logConsole(logText, 'log-p2p');
        });
    }

    function runBlackboardSimulation() {
        const v = state.vitals;
        elements.blackboardBody.innerHTML = '';
        const now = new Date().toLocaleTimeString();

        const entries = [
            { time: now, agent: 'VitalIngestionKS', cat: 'TELEMETRY', data: `Patient ${state.patient.name}: Ingested SpO2=${v.spo2}%, HR=${v.heart_rate} bpm, BP=${v.systolic_bp} mmHg.` }
        ];

        let alertLevel = 'GREEN - STABLE';
        let alertClass = 'green';

        if (v.troponin_level > 0.1 || (v.heart_rate > 130 && v.systolic_bp < 90)) {
            alertLevel = 'RED - CRITICAL CARDIAC EMERGENCY';
            alertClass = 'red';
            entries.push({ time: now, agent: 'CardiacEvaluatorKS', cat: 'CRITICAL_ALERT', data: `HYPOTHESIS: High Cardiac Ischemia Risk. Troponin=${v.troponin_level} ng/mL.` });
        }
        if (v.spo2 < 88) {
            alertLevel = 'RED - RESPIRATORY CRISIS';
            alertClass = 'red';
            entries.push({ time: now, agent: 'RespiratoryEvaluatorKS', cat: 'CRITICAL_ALERT', data: `HYPOTHESIS: Severe Hypoxic Respiratory Distress (SpO2=${v.spo2}%).` });
        }

        elements.bbAlertFlag.innerText = alertLevel;
        elements.bbAlertFlag.className = `bb-status-flag ${alertClass}`;

        entries.forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${e.time}</td><td><strong>${e.agent}</strong></td><td><span class="pill-status">${e.cat}</span></td><td>${e.data}</td>`;
            elements.blackboardBody.appendChild(tr);
            logConsole(`[Blackboard] [${e.agent}]: ${e.data}`, 'log-bb');
        });
    }

    function runParallelSimulation() {
        const v = state.vitals;
        const latCardio = (Math.random() * 2 + 1.5).toFixed(2);
        const latResp = (Math.random() * 2 + 1.5).toFixed(2);
        const latMetabolic = (Math.random() * 2 + 1.5).toFixed(2);

        document.getElementById('lat-cardio').innerText = `${latCardio} ms`;
        document.getElementById('lat-resp').innerText = `${latResp} ms`;
        document.getElementById('lat-metabolic').innerText = `${latMetabolic} ms`;

        const statCardio = (v.heart_rate > 120 || v.troponin_level > 0.1) ? 'CRITICAL' : 'NORMAL';
        const statResp = (v.spo2 < 90) ? 'CRITICAL' : 'NORMAL';
        const statMetabolic = (v.blood_glucose > 200) ? 'ABNORMAL' : 'NORMAL';

        document.getElementById('stat-cardio').innerText = statCardio;
        document.getElementById('stat-cardio').className = `worker-status ${statCardio === 'CRITICAL' ? 'status-critical' : 'status-normal'}`;

        document.getElementById('stat-resp').innerText = statResp;
        document.getElementById('stat-resp').className = `worker-status ${statResp === 'CRITICAL' ? 'status-critical' : 'status-normal'}`;

        document.getElementById('stat-metabolic').innerText = statMetabolic;
        document.getElementById('stat-metabolic').className = `worker-status ${statMetabolic === 'NORMAL' ? 'status-normal' : 'status-mild'}`;

        const maxLat = Math.max(latCardio, latResp, latMetabolic);
        document.getElementById('total-parallel-time').innerText = `${maxLat} ms (Concurrent Thread Execution)`;

        logConsole(`[Parallel Execution] 3 Worker Agents processed telemetry in ${maxLat} ms. Cardio: ${statCardio}, Resp: ${statResp}.`, 'log-par');
    }

    function runSequentialSimulation() {
        const v = state.vitals;
        const steps = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
        
        let delay = 0;
        steps.forEach((stepId, idx) => {
            setTimeout(() => {
                steps.forEach(s => document.getElementById(s).classList.remove('active-step'));
                const elem = document.getElementById(stepId);
                elem.classList.add('active-step');

                if (stepId === 'step-1') {
                    document.getElementById('p-step-1').innerText = `Validating telemetry stream for ${state.patient.name}...`;
                } else if (stepId === 'step-2') {
                    const shockIdx = (v.heart_rate / Math.max(v.systolic_bp, 1)).toFixed(2);
                    document.getElementById('p-step-2').innerText = `Shock Index: ${shockIdx} (Normal: 0.5 - 0.7).`;
                } else if (stepId === 'step-3') {
                    const evalRes = evaluateMLModel();
                    document.getElementById('p-step-3').innerText = `ML Prediction: ${evalRes.riskLabel}.`;
                } else if (stepId === 'step-4') {
                    const evalRes = evaluateMLModel();
                    document.getElementById('p-step-4').innerText = `Triage: ${evalRes.score >= 4 ? 'Priority 1 - Immediate ICU' : 'Priority 4 - Floor Monitoring'}.`;
                } else if (stepId === 'step-5') {
                    const evalRes = evaluateMLModel();
                    document.getElementById('p-step-5').innerText = evalRes.score >= 4 ? 'Alert Dispatched: ICU Crash Team!' : 'Telemetry logged to EHR.';
                }

                logConsole(`[Sequential Pipeline] Step ${idx + 1} completed: ${elem.querySelector('h4').innerText}`, 'log-seq');
            }, delay);
            delay += 200;
        });
    }

    elements.runAgentsBtn.addEventListener('click', () => {
        logConsole(`\n--- EVALUATING PATIENT ${state.patient.name.toUpperCase()} (${state.patient.id}) ---`, 'log-alert');
        evaluateMLModel();
        runP2PSimulation();
        runBlackboardSimulation();
        runParallelSimulation();
        runSequentialSimulation();
    });

    // ==========================================
    // 5. PATIENT AI CONSULTATION & Q&A PORTAL (TAB 5)
    // ==========================================
    function handlePatientQuestion(questionText) {
        if (!questionText.trim()) return;

        // 1. Append User Message
        appendChatMessage(state.patient.name, questionText, 'user-bubble');
        elements.qaInput.value = '';

        // 2. Generate Multi-Agent Specialist Guidance
        const v = state.vitals;
        setTimeout(() => {
            let responseText = "";
            const lowerQ = questionText.toLowerCase();

            if (lowerQ.includes('troponin') || lowerQ.includes('heart') || lowerQ.includes('chest')) {
                responseText = `[CardiologistAgent & PulmonologistAgent]: Your current troponin level is ${v.troponin_level} ng/mL (Normal < 0.04 ng/mL) and heart rate is ${v.heart_rate} bpm. Elevated troponin indicates heart muscle stress or ischemia. Because you reported "${state.patient.symptoms}", our multi-agent triage system has notified the attending physician for immediate cardiac assessment.`;
            } else if (lowerQ.includes('spo2') || lowerQ.includes('oxygen') || lowerQ.includes('breath')) {
                responseText = `[PulmonologistAgent]: Your oxygen saturation (SpO2) is currently ${v.spo2}% with a respiration rate of ${v.respiration_rate} breaths/min. Values below 90% indicate hypoxemic distress. High-flow supplemental oxygen therapy is recommended.`;
            } else if (lowerQ.includes('glucose') || lowerQ.includes('sugar') || lowerQ.includes('fever')) {
                responseText = `[EndocrinologistAgent]: Your blood glucose is ${v.blood_glucose} mg/dL and temperature is ${v.body_temp} °C. High blood sugar can occur during acute physical stress. Our agents are continuously monitoring your metabolic stability.`;
            } else {
                responseText = `[Multi-Agent Specialist Panel]: Based on your live telemetry (HR: ${v.heart_rate} bpm, SpO2: ${v.spo2}%, BP: ${v.systolic_bp} mmHg) and complaints of "${state.patient.symptoms}", our P2P specialist agents are continuously cross-referencing your organs for optimal treatment. Please rest while your medical team evaluates your progress.`;
            }

            appendChatMessage("Multi-Agent Medical Panel", responseText, 'bot-bubble');
            logConsole(`[Patient Q&A] Answered patient query regarding: "${questionText.substring(0, 30)}..."`, 'log-p2p');
        }, 400);
    }

    function appendChatMessage(sender, text, bubbleClass) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${bubbleClass}`;
        bubble.innerHTML = `
            <div class="bubble-header">
                <i class="fa-solid ${bubbleClass === 'user-bubble' ? 'fa-user' : 'fa-user-doctor'}"></i>
                <span>${sender}</span>
            </div>
            <p>${text}</p>
        `;
        elements.qaChatWindow.appendChild(bubble);
        elements.qaChatWindow.scrollTop = elements.qaChatWindow.scrollHeight;
    }

    elements.qaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handlePatientQuestion(elements.qaInput.value);
    });

    elements.chipBtns.forEach(chip => {
        chip.addEventListener('click', () => {
            const q = chip.getAttribute('data-question');
            handlePatientQuestion(q);
        });
    });

    // Console Utilities
    function logConsole(text, cssClass = 'log-sys') {
        const div = document.createElement('div');
        div.className = `log-entry ${cssClass}`;
        div.innerText = text;
        elements.consoleLogs.appendChild(div);
        elements.consoleLogs.scrollTop = elements.consoleLogs.scrollHeight;
    }

    elements.clearConsoleBtn.addEventListener('click', () => {
        elements.consoleLogs.innerHTML = '';
        logConsole('[SYS] Log console cleared.');
    });

    // Initial setup call
    updateVitalsFromUI();
    logConsole(`[SYS] Healthcare Monitor & Patient Portal initialized for ${state.patient.name}.`);
});
