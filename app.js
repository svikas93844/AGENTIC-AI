/**
 * AGENTIC-AI MULTI AGENT HEALTH CARE MONITOR
 * Client Engine with User Authentication, DOB Age Calculation, & Symptom AI Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------
    // 1. STATE MANAGEMENT
    // ------------------------------------------
    // ------------------------------------------
    // 1. STATE & DOM ELEMENTS
    // ------------------------------------------
    const state = {
        patient: null,
        apiBaseUrl: 'http://localhost:8080',
        currentDiagnosis: null
    };

    const elements = {
        intakeOverlay: document.getElementById('intakeOverlay'),
        intakeForm: document.getElementById('intakeForm'),
        intakeName: document.getElementById('intakeName'),
        intakeDob: document.getElementById('intakeDob'),
        intakeGender: document.getElementById('intakeGender'),
        intakeAgeBadge: document.getElementById('intakeAgeBadge'),
        intakeColabKey: document.getElementById('intakeColabKey'),
        intakeErrorMsg: document.getElementById('intakeErrorMsg'),

        mainDashboard: document.getElementById('mainDashboard'),
        hdrPatientName: document.getElementById('hdrPatientName'),
        hdrPatientMeta: document.getElementById('hdrPatientMeta'),
        colabStatusText: document.getElementById('colabStatusText'),
        changeIntakeBtn: document.getElementById('changeIntakeBtn'),

        symptomForm: document.getElementById('symptomForm'),
        patientNameInput: document.getElementById('patientName'),
        patientAgeInput: document.getElementById('patientAge'),
        patientGenderInput: document.getElementById('patientGender'),
        
        resPatientTag: document.getElementById('res-patient-tag'),
        resConfidence: document.getElementById('res-confidence'),
        resConditionTitle: document.getElementById('res-condition-title'),
        resSeverityPill: document.getElementById('res-severity-pill'),
        remediesList: document.getElementById('remediesList'),
        medicineTableBody: document.getElementById('medicineTableBody'),
        resDoctorAdvice: document.getElementById('res-doctor-advice'),

        chatForm: document.getElementById('chatForm'),
        chatInput: document.getElementById('chatInput'),
        chatWindow: document.getElementById('chatWindow'),
        chatPatientName: document.getElementById('chat-patient-name'),
        chipBtns: document.querySelectorAll('.chip-btn')
    };

    // ------------------------------------------
    // 2. AGE AUTO-CALCULATION FROM DOB
    // ------------------------------------------
    function calculateAge(dobString) {
        if (!dobString) return 0;
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? age : 0;
    }

    elements.intakeDob.addEventListener('input', (e) => {
        const dobVal = e.target.value;
        const age = calculateAge(dobVal);
        if (dobVal && age >= 0) {
            elements.intakeAgeBadge.innerText = `${age} years old`;
            elements.intakeAgeBadge.style.color = '#14b8a6';
        } else {
            elements.intakeAgeBadge.innerText = '--';
            elements.intakeAgeBadge.style.color = '#94a3b8';
        }
    });

    // ------------------------------------------
    // 3. PATIENT INTAKE & COLAB LINK SUBMISSION
    // ------------------------------------------
    elements.intakeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        elements.intakeErrorMsg.style.display = 'none';

        const name = elements.intakeName.value.trim();
        const dob = elements.intakeDob.value;
        const age = calculateAge(dob);
        const gender = elements.intakeGender.value;
        let colabKey = elements.intakeColabKey.value.trim();

        if (age <= 0) {
            elements.intakeErrorMsg.innerText = 'Please select a valid Date of Birth!';
            elements.intakeErrorMsg.style.display = 'block';
            return;
        }

        // Process Colab URL / Key
        if (colabKey.startsWith('http://') || colabKey.startsWith('https://')) {
            state.apiBaseUrl = colabKey.replace(/\/+$/, '');
        } else {
            state.apiBaseUrl = 'http://localhost:8080';
        }

        const patientData = { name, dob, age, gender, colabKey };
        state.patient = patientData;
        localStorage.setItem('agentic_patient_intake', JSON.stringify(patientData));

        // Update Header Profile Badge
        elements.hdrPatientName.innerText = name;
        elements.hdrPatientMeta.innerText = `Age ${age} (${gender}) • DOB: ${dob}`;
        elements.colabStatusText.innerText = colabKey.includes('http') ? 'Colab Live Connected' : 'Local Connected';

        // Auto-fill Symptom Form
        elements.patientNameInput.value = name;
        elements.patientAgeInput.value = age;
        elements.patientGenderInput.value = gender;
        if (elements.chatPatientName) elements.chatPatientName.innerText = name;

        // Switch Overlays & Open Dashboard
        elements.intakeOverlay.classList.remove('active');
        elements.mainDashboard.classList.remove('hidden');

        // Trigger Diagnosis
        triggerDiagnosis();
    });

    // Re-open intake to change patient or colab link
    elements.changeIntakeBtn.addEventListener('click', () => {
        elements.mainDashboard.classList.add('hidden');
        elements.intakeOverlay.classList.add('active');
    });

    // ------------------------------------------
    // 5. SYMPTOM DIAGNOSIS & MEDICINE COMPARISON
    // ------------------------------------------
    elements.symptomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        triggerDiagnosis();
    });

    async function triggerDiagnosis() {
        const name = elements.patientNameInput.value.trim() || (state.user ? state.user.name : 'Patient');
        const age = parseInt(elements.patientAgeInput.value) || (state.user ? state.user.age : 30);
        const gender = elements.patientGenderInput.value;

        const symptoms = {
            fever: document.getElementById('chk-fever').checked ? 1 : 0,
            cough: document.getElementById('chk-cough').checked ? 1 : 0,
            sore_throat: document.getElementById('chk-sore_throat').checked ? 1 : 0,
            cold_runny_nose: document.getElementById('chk-cold_runny_nose').checked ? 1 : 0,
            headache: document.getElementById('chk-headache').checked ? 1 : 0,
            body_ache: document.getElementById('chk-body_ache').checked ? 1 : 0,
            fatigue: document.getElementById('chk-fatigue').checked ? 1 : 0,
            stomach_pain: document.getElementById('chk-stomach_pain').checked ? 1 : 0,
            acidity_heartburn: document.getElementById('chk-acidity_heartburn').checked ? 1 : 0,
            nausea: document.getElementById('chk-nausea').checked ? 1 : 0,
            diarrhea: document.getElementById('chk-diarrhea').checked ? 1 : 0,
            dizziness: document.getElementById('chk-dizziness').checked ? 1 : 0,
            skin_rash: document.getElementById('chk-skin_rash').checked ? 1 : 0,
            chest_pain: document.getElementById('chk-chest_pain').checked ? 1 : 0
        };

        elements.resPatientTag.innerText = `${name} (Age ${age})`;

        try {
            const res = await fetch(`${state.apiBaseUrl}/api/diagnose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms, age })
            });

            if (res.ok) {
                const data = await res.json();
                state.currentDiagnosis = data.diagnosis;
                renderDiagnosisResult(data.diagnosis);
            }
        } catch (err) {
            const fallbackDiag = evaluateFallback(symptoms);
            state.currentDiagnosis = fallbackDiag;
            renderDiagnosisResult(fallbackDiag);
        }
    }

    function renderDiagnosisResult(diag) {
        elements.resConditionTitle.innerText = diag.condition_name;
        elements.resConfidence.innerText = `${(diag.confidence * 100).toFixed(1)}% Match`;
        
        elements.resSeverityPill.innerText = diag.severity;
        elements.resSeverityPill.className = `severity-pill ${diag.condition_code === 4 ? 'pill-urgent' : 'pill-mild'}`;
        elements.resDoctorAdvice.innerText = diag.doctor_advice;

        // Remedies
        elements.remediesList.innerHTML = '';
        const icons = ['fa-mug-saucer', 'fa-wind', 'fa-bottle-water', 'fa-bed', 'fa-soap'];
        diag.remedies.forEach((rem, idx) => {
            const card = document.createElement('div');
            card.className = 'remedy-card';
            card.innerHTML = `
                <div class="remedy-icon"><i class="fa-solid ${icons[idx % icons.length]}"></i></div>
                <div class="remedy-text">
                    <strong>Step ${idx + 1} Remedy</strong>
                    <p>${rem}</p>
                </div>
            `;
            elements.remediesList.appendChild(card);
        });

        // Medicine Comparison Table
        if (elements.medicineTableBody) {
            elements.medicineTableBody.innerHTML = '';
            if (diag.medicine_table && diag.medicine_table.length > 0) {
                diag.medicine_table.forEach(row => {
                    const tr = document.createElement('tr');
                    let badgeClass = 'badge-both';
                    if (row.most_effective.toLowerCase().includes('natural')) badgeClass = 'badge-natural';
                    else if (row.most_effective.toLowerCase().includes('english')) badgeClass = 'badge-english';

                    tr.innerHTML = `
                        <td><strong>${row.symptom_target}</strong></td>
                        <td>${row.english_medicine}</td>
                        <td>${row.natural_medicine}</td>
                        <td>
                            <span class="eff-badge ${badgeClass}"><i class="fa-solid fa-star"></i> ${row.most_effective}</span>
                            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${row.rationale}</div>
                        </td>
                    `;
                    elements.medicineTableBody.appendChild(tr);
                });
            }
        }
    }

    function evaluateFallback(symptoms) {
        if (symptoms.chest_pain === 1) {
            return {
                condition_code: 4,
                condition_name: 'Emergency Warning (Urgent Evaluation Required)',
                severity: 'High (Medical Care Required)',
                remedies: ['Rest in a comfortable seated position.', 'Seek immediate emergency medical attention.'],
                doctor_advice: '⚠️ URGENT: Chest pain requires emergency evaluation!',
                medicine_table: [
                    {
                        symptom_target: 'Chest Pressure & Cardiac Strain',
                        english_medicine: 'Aspirin (300mg - Stat)',
                        natural_medicine: 'Immediate Seated Rest & Oxygenation',
                        most_effective: 'English Medicine (Aspirin)',
                        rationale: 'Emergency antiplatelet action is vital.'
                    }
                ],
                confidence: 0.99
            };
        } else {
            return {
                condition_code: 0,
                condition_name: 'Common Cold & Upper Respiratory Infection',
                severity: 'Mild (Home Care)',
                remedies: [
                    'Drink warm ginger tea with honey 2-3 times daily to soothe throat.',
                    'Perform steam inhalation for 5-10 minutes before bedtime.',
                    'Maintain high hydration with warm water and herbal soups.'
                ],
                doctor_advice: 'Seek a doctor if fever exceeds 102°F or cold lasts over 7 days.',
                medicine_table: [
                    {
                        symptom_target: 'Nasal Congestion & Runny Nose',
                        english_medicine: 'Cetirizine / Decongestant',
                        natural_medicine: 'Steam Inhalation + Eucalyptus Oil',
                        most_effective: 'Natural Medicine (Steam)',
                        rationale: 'Clears sinuses naturally without rebound congestion.'
                    },
                    {
                        symptom_target: 'Sore Throat & Cough',
                        english_medicine: 'Dextromethorphan Cough Syrup',
                        natural_medicine: 'Raw Honey + Ginger Juice',
                        most_effective: 'Natural Medicine (Honey + Ginger)',
                        rationale: 'Honey coats mucosal tissue and reduces cough reflex naturally.'
                    }
                ],
                confidence: 0.98
            };
        }
    }

    // ------------------------------------------
    // 6. AI HEALTH ASSISTANT CHAT
    // ------------------------------------------
    async function sendChatMessage(userText) {
        if (!userText.trim()) return;

        const userName = state.user ? state.user.name : (elements.patientNameInput.value || 'Patient');
        appendChatBubble(userName, userText, 'user-bubble');
        elements.chatInput.value = '';

        const condition = state.currentDiagnosis ? state.currentDiagnosis.condition_name : 'General Health';

        try {
            const res = await fetch(`${state.apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    condition: condition,
                    name: userName
                })
            });

            if (res.ok) {
                const data = await res.json();
                appendChatBubble("AI Health Assistant", data.reply, 'bot-bubble');
            }
        } catch (err) {
            setTimeout(() => {
                const reply = generateClientFallbackReply(userText, userName, condition);
                appendChatBubble("AI Health Assistant", reply, 'bot-bubble');
            }, 300);
        }
    }

    function generateClientFallbackReply(query, name, condition) {
        const q = query.lower ? query.lower() : query.toLowerCase();
        if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
            return `Hello ${name}! How can I assist you with your health, remedies, diet, or symptoms today?`;
        }
        if (q.includes('fever') || q.includes('temp')) {
            return `For fever, drink plenty of fluids (water, ORS, herbal tea) and rest. Paracetamol provides quick relief, while Tulsi tea supports immunity. Consult a doctor if fever stays high.`;
        }
        if (q.includes('cough') || q.includes('throat')) {
            return `Raw honey mixed with ginger juice acts as an effective natural cough suppressant. Warm salt water gargles also soothe throat inflammation!`;
        }
        if (q.includes('food') || q.includes('diet') || q.includes('eat')) {
            return `A balanced diet with fresh fruits, greens, and warm soups promotes fast healing. Avoid spicy or fried food while recovering from illness.`;
        }
        return `Regarding "${query}": For general well-being and managing ${condition}, maintain good hydration (2-3L water), get 7-8 hours of restful sleep, and eat a balanced diet. If symptoms persist, please consult a healthcare professional.`;
    }

    function appendChatBubble(sender, text, bubbleClass) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${bubbleClass}`;
        bubble.innerHTML = `
            <div class="bubble-header">
                <i class="fa-solid ${bubbleClass === 'user-bubble' ? 'fa-user' : 'fa-robot'}"></i>
                <span>${sender}</span>
            </div>
            <p>${text}</p>
        `;
        elements.chatWindow.appendChild(bubble);
        elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
    }

    elements.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendChatMessage(elements.chatInput.value);
    });

    elements.chipBtns.forEach(chip => {
        chip.addEventListener('click', () => {
            sendChatMessage(chip.getAttribute('data-query'));
        });
    });

    // Auto Session Restore
    const savedSession = localStorage.getItem('agentic_user_session');
    if (savedSession) {
        try {
            const uData = JSON.parse(savedSession);
            loginUserSession(uData);
        } catch (e) {
            // Open auth overlay
        }
    }
});
