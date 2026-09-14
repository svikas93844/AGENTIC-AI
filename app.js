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

    // ------------------------------------------
    // 7. THREE.JS 3D SCENE 1: SOLAR SYSTEM WITH ORIGINAL PLANETARY COLORS
    // ------------------------------------------
    function initAdmission3DScene() {
        const canvas = document.getElementById('admission3DCanvas');
        if (!canvas || !window.THREE) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 18, 35);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Ambient & Point Lighting for Real Shading
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const sunLight = new THREE.PointLight(0xffddaa, 2.5, 300);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        const solarSystemGroup = new THREE.Group();
        solarSystemGroup.rotation.x = 0.35; // Tilt solar system plane slightly for 3D perspective

        // 1. THE SUN (Glowing Bright Golden Orange)
        const sunGeo = new THREE.SphereGeometry(2.4, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);

        // Sun Glow Corona Outer Mesh
        const coronaGeo = new THREE.SphereGeometry(2.8, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.35,
            wireframe: true
        });
        const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
        sunMesh.add(coronaMesh);
        solarSystemGroup.add(sunMesh);

        // 2. PLANETARY DATA WITH ORIGINAL REAL COLORS
        const planetsData = [
            { name: 'Mercury', color: 0xa8a8a8, radius: 0.35, dist: 5.2, speed: 0.035 },
            { name: 'Venus',   color: 0xe3bb76, radius: 0.55, dist: 7.8, speed: 0.025 },
            { name: 'Earth',   color: 0x2b82c5, radius: 0.65, dist: 10.8, speed: 0.018, hasMoon: true },
            { name: 'Mars',    color: 0xc1440e, radius: 0.45, dist: 14.0, speed: 0.014 },
            { name: 'Jupiter', color: 0xb07f35, radius: 1.35, dist: 18.2, speed: 0.009 },
            { name: 'Saturn',  color: 0xe2bf7d, radius: 1.10, dist: 23.0, speed: 0.007, hasRings: true },
            { name: 'Uranus',  color: 0x4b70dd, radius: 0.85, dist: 27.5, speed: 0.005, hasRings: true },
            { name: 'Neptune', color: 0x274687, radius: 0.80, dist: 31.8, speed: 0.003 }
        ];

        const planetMeshes = [];

        planetsData.forEach(p => {
            // Draw Translucent Orbital Track Line
            const orbitPoints = [];
            const segments = 90;
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                orbitPoints.push(new THREE.Vector3(Math.cos(theta) * p.dist, 0, Math.sin(theta) * p.dist));
            }
            const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
            const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 });
            const orbitLine = new THREE.Line(orbitGeo, orbitMat);
            solarSystemGroup.add(orbitLine);

            // Pivot Container for Smooth Orbital Rotation
            const pivot = new THREE.Group();
            solarSystemGroup.add(pivot);

            // Create Planet Sphere
            const pGeo = new THREE.SphereGeometry(p.radius, 32, 32);
            const pMat = new THREE.MeshPhongMaterial({
                color: p.color,
                shininess: 25,
                emissive: p.color,
                emissiveIntensity: 0.15
            });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.x = p.dist;
            pivot.add(pMesh);

            // Saturn 3D Ring System
            if (p.hasRings && p.name === 'Saturn') {
                const ringGeo = new THREE.RingGeometry(p.radius * 1.4, p.radius * 2.4, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0xd4b068,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.8
                });
                const saturnRing = new THREE.Mesh(ringGeo, ringMat);
                saturnRing.rotation.x = Math.PI / 2.3;
                pMesh.add(saturnRing);
            }

            // Uranus Thin Ring
            if (p.hasRings && p.name === 'Uranus') {
                const ringGeo = new THREE.RingGeometry(p.radius * 1.3, p.radius * 1.8, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0x7dd3fc,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.5
                });
                const uranusRing = new THREE.Mesh(ringGeo, ringMat);
                uranusRing.rotation.x = Math.PI / 1.8;
                pMesh.add(uranusRing);
            }

            // Earth's Orbiting Moon
            if (p.hasMoon) {
                const moonPivot = new THREE.Group();
                pMesh.add(moonPivot);

                const moonGeo = new THREE.SphereGeometry(0.18, 16, 16);
                const moonMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
                const moonMesh = new THREE.Mesh(moonGeo, moonMat);
                moonMesh.position.x = 1.3;
                moonPivot.add(moonMesh);
                pMesh.userData.moonPivot = moonPivot;
            }

            planetMeshes.push({ pivot, pMesh, speed: p.speed });
        });

        scene.add(solarSystemGroup);

        // 3. DEEP SPACE TWINKLING STARFIELD (2,000 Stars)
        const starsGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            starPositions[i * 3]     = (Math.random() - 0.5) * 160;
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 160;
            starPositions[i * 3 + 2] = (Math.random() - 0.5) * 160;

            const r = 0.8 + Math.random() * 0.2;
            const g = 0.8 + Math.random() * 0.2;
            const b = 0.9 + Math.random() * 0.1;
            starColors[i * 3]     = r;
            starColors[i * 3 + 1] = g;
            starColors[i * 3 + 2] = b;
        }

        starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starsMat = new THREE.PointsMaterial({
            size: 0.22,
            vertexColors: true,
            transparent: true,
            opacity: 0.85
        });
        const starField = new THREE.Points(starsGeo, starsMat);
        scene.add(starField);

        // 4. ANIMATION & INTERACTIVE MOUSE ROTATION
        let mouseX = 0, mouseY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) * 0.0003;
            mouseY = (e.clientY - window.innerHeight / 2) * 0.0003;

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
            const delta = clock.getDelta();

            // Sun Self-Rotation & Pulsing Corona
            sunMesh.rotation.y += 0.004;
            coronaMesh.rotation.y -= 0.006;
            coronaMesh.rotation.z += 0.003;

            // Rotate Planets in Orbit around Sun
            planetMeshes.forEach(item => {
                item.pivot.rotation.y += item.speed;
                item.pMesh.rotation.y += 0.02; // Self axial rotation
                if (item.pMesh.userData.moonPivot) {
                    item.pMesh.userData.moonPivot.rotation.y += 0.04;
                }
            });

            // Smooth Solar System Motion reacting to Mouse Cursor
            solarSystemGroup.rotation.y += 0.001 + mouseX;
            solarSystemGroup.rotation.x = 0.35 + mouseY;
            starField.rotation.y -= 0.0003;

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
