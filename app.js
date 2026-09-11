/**
 * Multi-Agent Healthcare Monitor Engine (JavaScript Web Application Mode)
 * Executes:
 * 1. Animated Lead II ECG Waveform Canvas
 * 2. Interactive Telemetry Sliders & Scenario Switcher
 * 3. 4 Core Multi-Agent Architectures (P2P, Blackboard, Parallel, Sequential Pipeline)
 * 4. ML Risk Scoring & Real-Time Agent Log Streaming
 */

document.addEventListener('DOMContentLoaded', () => {
    // State Management
    const state = {
        patientId: 'PT-9042-ICU',
        vitals: {
            heart_rate: 72,
            spo2: 98,
            systolic_bp: 120,
            diastolic_bp: 78,
            respiration_rate: 16,
            body_temp: 36.8,
            blood_glucose: 95,
            troponin_level: 0.01
        },
        activeArchTab: 'p2p',
        currentScenario: 'stable'
    };

    // DOM Elements
    const elements = {
        // Sliders
        sliderHr: document.getElementById('slider-hr'),
        sliderSpo2: document.getElementById('slider-spo2'),
        sliderSbp: document.getElementById('slider-sbp'),
        sliderRr: document.getElementById('slider-rr'),
        sliderTemp: document.getElementById('slider-temp'),
        sliderGlucose: document.getElementById('slider-glucose'),
        sliderTroponin: document.getElementById('slider-troponin'),

        // Slider Labels
        valHr: document.getElementById('val-hr'),
        valSpo2: document.getElementById('val-spo2'),
        valSbp: document.getElementById('val-sbp'),
        valRr: document.getElementById('val-rr'),
        valTemp: document.getElementById('val-temp'),
        valGlucose: document.getElementById('val-glucose'),
        valTroponin: document.getElementById('val-troponin'),

        // Telemetry Cards & Canvas
        cardValHr: document.getElementById('card-val-hr'),
        cardValSpo2: document.getElementById('card-val-spo2'),
        cardValBp: document.getElementById('card-val-bp'),
        cardValTemp: document.getElementById('card-val-temp'),
        ecgBpmReadout: document.getElementById('ecg-bpm-readout'),
        ecgCanvas: document.getElementById('ecgCanvas'),

        // Header Badges
        triageStatusBadge: document.getElementById('triage-status-badge'),
        emergencyAlertBadge: document.getElementById('emergency-alert-badge'),
        activeArchBadge: document.getElementById('active-arch-badge'),

        // ML Prediction Panel
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

        // Tabs & Feeds
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabPanes: document.querySelectorAll('.tab-pane'),
        scenarioBtns: document.querySelectorAll('.scenario-btn'),
        p2pMsgFeed: document.getElementById('p2p-msg-feed'),
        blackboardBody: document.getElementById('blackboard-entries-body'),
        bbAlertFlag: document.getElementById('bb-alert-flag')
    };

    // ==========================================
    // 1. ANIMATED ECG WAVEFORM CANVAS RENDERER
    // ==========================================
    const canvas = elements.ecgCanvas;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let ecgX = 0;
    const ecgBuffer = new Array(800).fill(45);

    function resizeCanvas() {
        if (canvas) {
            canvas.width = canvas.parentElement.clientWidth - 24;
            canvas.height = 90;
        }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawECGWave() {
        if (!canvas) return;
        ctx.fillStyle = '#060b13';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw background grid lines
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Generate ECG P-Q-R-S-T points based on Heart Rate
        const hr = state.vitals.heart_rate;
        const period = Math.max(20, Math.floor(6000 / hr));
        const cyclePos = ecgX % period;
        let yVal = 45;

        if (cyclePos === Math.floor(period * 0.15)) yVal = 38; // P wave
        else if (cyclePos === Math.floor(period * 0.30)) yVal = 50; // Q wave
        else if (cyclePos === Math.floor(period * 0.35)) yVal = 10; // R peak
        else if (cyclePos === Math.floor(period * 0.40)) yVal = 75; // S wave
        else if (cyclePos === Math.floor(period * 0.60)) yVal = 35; // T wave
        else yVal = 45 + (Math.random() * 2 - 1); // Baseline noise

        ecgBuffer[ecgX % canvas.width] = yVal;
        ecgX++;

        // Draw waveform
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 6;
        ctx.beginPath();

        for (let i = 0; i < canvas.width; i++) {
            const val = ecgBuffer[i];
            if (i === 0) ctx.moveTo(i, val);
            else ctx.lineTo(i, val);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        animationFrameId = requestAnimationFrame(drawECGWave);
    }
    drawECGWave();

    // ==========================================
    // 2. SCENARIOS & SLIDERS SYNC
    // ==========================================
    const presetScenarios = {
        stable: {
            heart_rate: 72, spo2: 98, systolic_bp: 120, respiration_rate: 16,
            body_temp: 36.8, blood_glucose: 95, troponin_level: 0.01
        },
        cardiac: {
            heart_rate: 148, spo2: 89, systolic_bp: 82, respiration_rate: 28,
            body_temp: 37.4, blood_glucose: 185, troponin_level: 2.15
        },
        sepsis: {
            heart_rate: 135, spo2: 85, systolic_bp: 78, respiration_rate: 34,
            body_temp: 40.2, blood_glucose: 280, troponin_level: 0.45
        },
        hypoxia: {
            heart_rate: 115, spo2: 78, systolic_bp: 145, respiration_rate: 38,
            body_temp: 38.1, blood_glucose: 140, troponin_level: 0.08
        }
    };

    function updateVitalsFromUI() {
        state.vitals.heart_rate = parseFloat(elements.sliderHr.value);
        state.vitals.spo2 = parseFloat(elements.sliderSpo2.value);
        state.vitals.systolic_bp = parseFloat(elements.sliderSbp.value);
        state.vitals.diastolic_bp = Math.round(state.vitals.systolic_bp * 0.65);
        state.vitals.respiration_rate = parseFloat(elements.sliderRr.value);
        state.vitals.body_temp = parseFloat(elements.sliderTemp.value);
        state.vitals.blood_glucose = parseFloat(elements.sliderGlucose.value);
        state.vitals.troponin_level = parseFloat(elements.sliderTroponin.value);

        // Update Labels
        elements.valHr.innerText = `${state.vitals.heart_rate} bpm`;
        elements.valSpo2.innerText = `${state.vitals.spo2} %`;
        elements.valSbp.innerText = `${state.vitals.systolic_bp} mmHg`;
        elements.valRr.innerText = `${state.vitals.respiration_rate} /min`;
        elements.valTemp.innerText = `${state.vitals.body_temp} °C`;
        elements.valGlucose.innerText = `${state.vitals.blood_glucose} mg/dL`;
        elements.valTroponin.innerText = `${state.vitals.troponin_level} ng/mL`;

        // Update Cards & ECG Readout
        elements.cardValHr.innerText = state.vitals.heart_rate;
        elements.cardValSpo2.innerText = state.vitals.spo2;
        elements.cardValBp.innerText = `${state.vitals.systolic_bp}/${state.vitals.diastolic_bp}`;
        elements.cardValTemp.innerText = state.vitals.body_temp;
        elements.ecgBpmReadout.innerText = `${state.vitals.heart_rate} BPM`;

        // Run immediate lightweight risk calculation
        evaluateMLModel();
    }

    // Slider Event Listeners
    [elements.sliderHr, elements.sliderSpo2, elements.sliderSbp, elements.sliderRr,
     elements.sliderTemp, elements.sliderGlucose, elements.sliderTroponin].forEach(slider => {
        slider.addEventListener('input', updateVitalsFromUI);
    });

    // Scenario Button Listeners
    elements.scenarioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.scenarioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const scKey = btn.getAttribute('data-scenario');
            const data = presetScenarios[scKey];
            if (data) {
                elements.sliderHr.value = data.heart_rate;
                elements.sliderSpo2.value = data.spo2;
                elements.sliderSbp.value = data.systolic_bp;
                elements.sliderRr.value = data.respiration_rate;
                elements.sliderTemp.value = data.body_temp;
                elements.sliderGlucose.value = data.blood_glucose;
                elements.sliderTroponin.value = data.troponin_level;
                updateVitalsFromUI();
                logConsole(`[SYS] Loaded preset clinical scenario: '${scKey.toUpperCase()}'.`);
            }
        });
    });

    // ==========================================
    // 3. ML MODEL EVALUATOR SIMULATOR
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
        elements.triageStatusBadge.innerText = riskLabel;
        elements.triageStatusBadge.className = `pill-status ${triageClass}`;

        elements.emergencyAlertBadge.innerText = score >= 4 ? "CODE RED ALERT" : "STABLE";
        elements.emergencyAlertBadge.className = `pill-status alert-pill ${score >= 4 ? 'status-critical' : 'status-standby'}`;

        elements.pbar0.style.width = `${probs[0]}%`;
        elements.pbar1.style.width = `${probs[1]}%`;
        elements.pbar2.style.width = `${probs[2]}%`;
        elements.pbar3.style.width = `${probs[3]}%`;

        return { score, riskLabel, probs };
    }

    // ==========================================
    // 4. MULTI-AGENT ARCHITECTURES SIMULATORS
    // ==========================================

    // Tab Switcher
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

    // Architecture 1: P2P Agent Simulator
    function runP2PSimulation() {
        const v = state.vitals;
        elements.p2pMsgFeed.innerHTML = '';

        const logs = [];
        logs.push(`[P2P Mesh Initialized] 3 Specialist Agents connected (Pulmonologist, Cardiologist, Endocrinologist).`);

        if (v.spo2 < 90) {
            logs.push(`[PulmonologistAgent -> CardiologistAgent]: "Alert: SpO2 dropped to ${v.spo2}%. Is ischemic cardiac compensation required?"`);
        }
        if (v.heart_rate > 120 || v.troponin_level > 0.1) {
            logs.push(`[CardiologistAgent -> EndocrinologistAgent]: "Tachycardia & elevated Troponin (${v.troponin_level} ng/mL). Check metabolic drive!"`);
        }
        if (v.blood_glucose > 200) {
            logs.push(`[EndocrinologistAgent -> PulmonologistAgent]: "Glucose spike ${v.blood_glucose} mg/dL. Hyperglycemic metabolic acidosis risk evaluated."`);
        }
        if (logs.length === 1) {
            logs.push(`[P2P Negotiation]: All specialist agents report normal physiology across cardiac, pulmonary, and endocrine channels.`);
        }

        logs.forEach(logText => {
            const div = document.createElement('div');
            div.className = 'p2p-msg';
            div.innerText = logText;
            elements.p2pMsgFeed.appendChild(div);
            logConsole(logText, 'log-p2p');
        });
    }

    // Architecture 2: Blackboard Architecture Simulator
    function runBlackboardSimulation() {
        const v = state.vitals;
        elements.blackboardBody.innerHTML = '';
        const now = new Date().toLocaleTimeString();

        const entries = [
            { time: now, agent: 'VitalIngestionKS', cat: 'TELEMETRY', data: `Ingested SpO2=${v.spo2}%, HR=${v.heart_rate} bpm, BP=${v.systolic_bp} mmHg.` }
        ];

        let alertLevel = 'GREEN - STABLE';
        let alertClass = 'green';

        if (v.troponin_level > 0.1 || (v.heart_rate > 130 && v.systolic_bp < 90)) {
            alertLevel = 'RED - CRITICAL CARDIAC EMERGENCY';
            alertClass = 'red';
            entries.push({ time: now, agent: 'CardiacEvaluatorKS', cat: 'CRITICAL_ALERT', data: `HYPOTHESIS: Severe Ischemia / Cardiogenic Shock. Troponin=${v.troponin_level} ng/mL.` });
        }
        if (v.spo2 < 88) {
            alertLevel = 'RED - RESPIRATORY CRISIS';
            alertClass = 'red';
            entries.push({ time: now, agent: 'RespiratoryEvaluatorKS', cat: 'CRITICAL_ALERT', data: `HYPOTHESIS: Acute Respiratory Distress (SpO2=${v.spo2}%).` });
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

    // Architecture 3: Parallel Execution Simulator
    function runParallelSimulation() {
        const v = state.vitals;
        const latCardio = (Math.random() * 3 + 2).toFixed(2);
        const latResp = (Math.random() * 3 + 2).toFixed(2);
        const latMetabolic = (Math.random() * 3 + 2).toFixed(2);

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

        logConsole(`[Parallel Execution] 3 Sensor Workers completed in ${maxLat} ms. Cardio: ${statCardio}, Resp: ${statResp}, Metabolic: ${statMetabolic}.`, 'log-par');
    }

    // Architecture 4: Sequential Pipeline Simulator
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
                    document.getElementById('p-step-1').innerText = `Ingested ${Object.keys(v).length} vital telemetry parameters cleanly.`;
                } else if (stepId === 'step-2') {
                    const shockIdx = (v.heart_rate / Math.max(v.systolic_bp, 1)).toFixed(2);
                    document.getElementById('p-step-2').innerText = `Computed Shock Index: ${shockIdx} (Normal: 0.5 - 0.7).`;
                } else if (stepId === 'step-3') {
                    const evalRes = evaluateMLModel();
                    document.getElementById('p-step-3').innerText = `RandomForest Prediction: ${evalRes.riskLabel}.`;
                } else if (stepId === 'step-4') {
                    const evalRes = evaluateMLModel();
                    document.getElementById('p-step-4').innerText = `ESI Triage Priority: ${evalRes.score >= 4 ? 'Level 1 Immediate ICU' : 'Level 4 Routine Monitor'}.`;
                } else if (stepId === 'step-5') {
                    const evalRes = evaluateMLModel();
                    document.getElementById('p-step-5').innerText = evalRes.score >= 4 ? 'Alert Dispatched: Rapid Response Crash Team!' : 'Telemetry logged to EHR.';
                }

                logConsole(`[Sequential Pipeline] Step ${idx + 1} completed: ${elem.querySelector('h4').innerText}`, 'log-seq');
            }, delay);
            delay += 250;
        });
    }

    // Trigger Button Click Listener
    elements.runAgentsBtn.addEventListener('click', () => {
        logConsole(`\n--- TRIGGERING MULTI-AGENT EVALUATION ACROSS ALL ARCHITECTURES ---`, 'log-alert');
        evaluateMLModel();
        runP2PSimulation();
        runBlackboardSimulation();
        runParallelSimulation();
        runSequentialSimulation();
    });

    // Console Logging Utility
    function logConsole(text, cssClass = 'log-sys') {
        const div = document.createElement('div');
        div.className = `log-entry ${cssClass}`;
        div.innerText = text;
        elements.consoleLogs.appendChild(div);
        elements.consoleLogs.scrollTop = elements.consoleLogs.scrollHeight;
    }

    elements.clearConsoleBtn.addEventListener('click', () => {
        elements.consoleLogs.innerHTML = '';
        logConsole('[SYS] Console logs cleared.');
    });

    // Initial setup call
    updateVitalsFromUI();
    logConsole('[SYS] Multi-Agent Healthcare Monitor Dashboard loaded successfully.');
});
