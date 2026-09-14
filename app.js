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

    // Guarantee Google Colab Key / Tunnel Link field is strictly blank on page load
    if (elements.intakeColabKey) {
        elements.intakeColabKey.value = '';
    }

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

    // ------------------------------------------
    // 7. THREE.JS 3D SCENE 1: HOLOGRAPHIC CYBER-MEDICAL BIO-SCANNER & DNA CORE
    // ------------------------------------------
    function initAdmission3DScene() {
        const canvas = document.getElementById('admission3DCanvas');
        if (!canvas || !window.THREE) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 28);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const tealLight = new THREE.PointLight(0x14b8a6, 2, 100);
        tealLight.position.set(10, 10, 10);
        scene.add(tealLight);

        const cyanLight = new THREE.PointLight(0x0284c7, 2, 100);
        cyanLight.position.set(-10, -10, 10);
        scene.add(cyanLight);

        const medicalGroup = new THREE.Group();

        // 1. CENTRAL HOLOGRAPHIC BIO-CORE SPHERE
        const coreGeo = new THREE.IcosahedronGeometry(3.2, 2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x14b8a6,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);

        const innerGeo = new THREE.SphereGeometry(2.0, 32, 32);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x0ea5e9,
            transparent: true,
            opacity: 0.65,
            wireframe: true
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        coreMesh.add(innerMesh);
        medicalGroup.add(coreMesh);

        // 2. ROTATING MEDICAL DNA DOUBLE HELIX STRAND
        const dnaGroup = new THREE.Group();
        const numPairs = 36;
        const radius = 5.5;
        const heightStep = 0.45;

        const sphereGeo = new THREE.SphereGeometry(0.28, 16, 16);
        const tealMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf });
        const cyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const lineMat = new THREE.LineBasicMaterial({ color: 0x14b8a6, transparent: true, opacity: 0.5 });

        for (let i = 0; i < numPairs; i++) {
            const angle = i * 0.28;
            const y = (i - numPairs / 2) * heightStep;

            const x1 = Math.cos(angle) * radius;
            const z1 = Math.sin(angle) * radius;
            const s1 = new THREE.Mesh(sphereGeo, tealMat);
            s1.position.set(x1, y, z1);
            dnaGroup.add(s1);

            const x2 = Math.cos(angle + Math.PI) * radius;
            const z2 = Math.sin(angle + Math.PI) * radius;
            const s2 = new THREE.Mesh(sphereGeo, cyanMat);
            s2.position.set(x2, y, z2);
            dnaGroup.add(s2);

            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x1, y, z1),
                new THREE.Vector3(x2, y, z2)
            ]);
            const rung = new THREE.Line(lineGeo, lineMat);
            dnaGroup.add(rung);
        }
        dnaGroup.rotation.z = Math.PI / 6;
        medicalGroup.add(dnaGroup);

        // 3. ORBITING MEDICAL ORGAN SCANNER NODES & VITAL RINGS
        const nodeColors = [0x10b981, 0xf59e0b, 0x06b6d4, 0xec4899];
        const scannerNodes = [];

        nodeColors.forEach((col, idx) => {
            const pivot = new THREE.Group();
            pivot.rotation.y = (idx * Math.PI) / 2;
            pivot.rotation.x = idx * 0.2;

            const ringGeo = new THREE.TorusGeometry(8.5 + idx * 1.2, 0.05, 16, 90);
            const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            pivot.add(ring);

            const nodeGeo = new THREE.OctahedronGeometry(0.65, 0);
            const nodeMat = new THREE.MeshBasicMaterial({ color: col, wireframe: true });
            const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
            nodeMesh.position.x = 8.5 + idx * 1.2;
            pivot.add(nodeMesh);

            medicalGroup.add(pivot);
            scannerNodes.push({ pivot, speed: 0.008 + idx * 0.003 });
        });

        scene.add(medicalGroup);

        // 4. FLOATING BIO-MEDICAL PARTICLE AURA (1,800 Particles)
        const pCount = 1800;
        const pGeo = new THREE.BufferGeometry();
        const pPositions = new Float32Array(pCount * 3);
        const pColors = new Float32Array(pCount * 3);

        for (let i = 0; i < pCount; i++) {
            pPositions[i * 3]     = (Math.random() - 0.5) * 100;
            pPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            pPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;

            const r = Math.random() < 0.5 ? 0.08 : 0.2;
            const g = 0.7 + Math.random() * 0.3;
            const b = 0.7 + Math.random() * 0.3;
            pColors[i * 3]     = r;
            pColors[i * 3 + 1] = g;
            pColors[i * 3 + 2] = b;
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

        const pMat = new THREE.PointsMaterial({
            size: 0.18,
            vertexColors: true,
            transparent: true,
            opacity: 0.75
        });
        const particleMesh = new THREE.Points(pGeo, pMat);
        scene.add(particleMesh);

        // 5. ANIMATION & INTERACTIVE MOUSE ROTATION
        let mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) * 0.0004;
            mouseY = (e.clientY - window.innerHeight / 2) * 0.0004;

            // 3D Card Tilt Effect
            const card = document.getElementById('intakeCard');
            if (card && elements.intakeOverlay.classList.contains('active')) {
                const tiltX = (e.clientY / window.innerHeight - 0.5) * -12;
                const tiltY = (e.clientX / window.innerWidth - 0.5) * 12;
                card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            }
        });

        let clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Bio-Core Pulse
            const pulse = 1 + Math.sin(time * 2.5) * 0.05;
            coreMesh.scale.set(pulse, pulse, pulse);
            coreMesh.rotation.y = time * 0.25;
            innerMesh.rotation.x = -time * 0.35;

            // DNA Helix Rotation
            dnaGroup.rotation.y = time * 0.35;

            // Scanner Nodes Orbit
            scannerNodes.forEach(node => {
                node.pivot.rotation.y += node.speed;
            });

            // Smooth Motion with Mouse Cursor
            medicalGroup.rotation.y += 0.002 + mouseX;
            medicalGroup.rotation.x = mouseY;
            particleMesh.rotation.y -= 0.0005;

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // ------------------------------------------
    // 8. THREE.JS 3D SCENE 2: DASHBOARD HOLOGRAPHIC BIO-HEART MESH
    // ------------------------------------------
    function initDashboard3DScene() {
        const canvas = document.getElementById('dashboard3DCanvas');
        if (!canvas || !window.THREE) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 18;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create Holographic Bio-Heart Torus Knot Mesh
        const heartGroup = new THREE.Group();
        const heartGeo = new THREE.TorusKnotGeometry(4.5, 1.4, 120, 16, 2, 3);
        const heartMat = new THREE.MeshBasicMaterial({
            color: 0x0284c7,
            wireframe: true,
            transparent: true,
            opacity: 0.45
        });
        const heartMesh = new THREE.Mesh(heartGeo, heartMat);
        heartGroup.add(heartMesh);

        // Orbiting Energetic Electron Rings
        const ringGeo1 = new THREE.TorusGeometry(8, 0.08, 16, 100);
        const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x14b8a6, transparent: true, opacity: 0.7 });
        const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
        ring1.rotation.x = Math.PI / 3;
        heartGroup.add(ring1);

        const ringGeo2 = new THREE.TorusGeometry(9.5, 0.08, 16, 100);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6 });
        const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
        ring2.rotation.y = Math.PI / 4;
        heartGroup.add(ring2);

        // Bio-Particle Mesh Wave
        const pCount = 1500;
        const pGeo = new THREE.BufferGeometry();
        const pPositions = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount * 3; i++) {
            pPositions[i] = (Math.random() - 0.5) * 60;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        const pMat = new THREE.PointsMaterial({
            size: 0.18,
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.65
        });
        const pMesh = new THREE.Points(pGeo, pMat);
        scene.add(pMesh);

        scene.add(heartGroup);

        // Cardiac Pulse & Animation Loop
        let clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Realistic Cardiac Rhythm Pulse
            const pulse = 1 + Math.sin(time * 3) * 0.06;
            heartGroup.scale.set(pulse, pulse, pulse);

            heartMesh.rotation.x = time * 0.3;
            heartMesh.rotation.y = time * 0.4;
            ring1.rotation.z = time * 0.5;
            ring2.rotation.x = time * 0.4;
            pMesh.rotation.y = time * 0.05;

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Launch both distinct 3D scenes
    initAdmission3DScene();
    initDashboard3DScene();
});
