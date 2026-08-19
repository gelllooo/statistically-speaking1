// A brief fade keeps movement between research documents understated.
document.querySelectorAll("a[href]").forEach((link) => {
    const destination = new URL(link.href, window.location.origin);

    if (destination.origin !== window.location.origin || link.target === "_blank") {
        return;
    }

    link.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
            return;
        }

        event.preventDefault();
        document.body.classList.add("page-leaving");
        window.setTimeout(() => {
            window.location.href = link.href;
        }, 180);
    });
});

const profileForm = document.querySelector("#respondent-profile");

if (profileForm) {
    const savedProfile = JSON.parse(sessionStorage.getItem("respondentProfile") || "{}");

    Object.entries(savedProfile).forEach(([name, value]) => {
        const field = profileForm.elements.namedItem(name);
        if (field) field.value = value;
    });

    profileForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const profile = Object.fromEntries(new FormData(profileForm).entries());
        sessionStorage.setItem("respondentProfile", JSON.stringify(profile));
        sessionStorage.removeItem("questionnaireAnswers");
        sessionStorage.removeItem("questionnairePosition");
        sessionStorage.removeItem("questionnaireComplete");
        document.body.classList.add("page-leaving");
        window.setTimeout(() => {
            window.location.href = "/questionnaire";
        }, 180);
    });
}

const questionnaireForm = document.querySelector("#questionnaire-form");

if (questionnaireForm) {
    const questions = [
        { type: "text", prompt: "What's something you could talk about for an unnecessarily long amount of time?" },
        { type: "choice", prompt: "What's your ideal kind of conversation?", options: ["Random nonsense at 2 AM", "Deep philosophical discussions", "Intellectual debates", "Gossip and life updates", "A chaotic combination of everything"] },
        { type: "text", prompt: "What makes someone genuinely interesting to you?" },
        { type: "text", prompt: "What's a green flag you think people don't talk about enough?" },
        { type: "text", prompt: "What's something that instantly makes you comfortable around someone?" },
        { type: "choice", prompt: "Which is more attractive?", options: ["Someone who makes you laugh", "Someone who challenges your thinking", "Someone who understands you without much explanation", "Someone who makes ordinary moments fun", "Unfortunately, all of the above"] },
        { type: "scale", prompt: "How important is intellectual compatibility to you?" },
        { type: "choice", prompt: "Do you believe someone can become important to you unexpectedly?", options: ["Definitely", "Maybe", "I'm not sure", "That's suspiciously specific"] },
    ];
    let currentQuestion = Number(sessionStorage.getItem("questionnairePosition") || 0);
    const answers = JSON.parse(sessionStorage.getItem("questionnaireAnswers") || "{}");
    const progress = document.querySelector("#question-progress");
    const number = document.querySelector("#question-number");
    const prompt = document.querySelector("#question-text");
    const inputArea = document.querySelector("#question-input");
    const error = document.querySelector("#question-error");
    const previous = document.querySelector("#previous-question");
    const next = document.querySelector("#next-question");
    const complete = document.querySelector("#questionnaire-complete");

    function showCompletion() {
        questionnaireForm.hidden = true;
        complete.hidden = false;
        progress.textContent = "QUESTIONNAIRE COMPLETE";
        window.setTimeout(() => {
            window.location.href = complete.dataset.analysisUrl;
        }, 1500);
    }

    function saveState() {
        sessionStorage.setItem("questionnaireAnswers", JSON.stringify(answers));
        sessionStorage.setItem("questionnairePosition", String(currentQuestion));
    }

    function renderQuestion() {
        const question = questions[currentQuestion];
        const questionNumber = currentQuestion + 1;
        progress.textContent = `QUESTION ${String(questionNumber).padStart(2, "0")} / 08`;
        number.textContent = `QUESTION ${String(questionNumber).padStart(2, "0")}`;
        prompt.textContent = question.prompt;
        error.textContent = "";
        previous.disabled = currentQuestion === 0;
        next.innerHTML = currentQuestion === questions.length - 1
            ? "COMPLETE QUESTIONNAIRE <span aria-hidden=\"true\">→</span>"
            : "NEXT QUESTION <span aria-hidden=\"true\">→</span>";

        if (question.type === "text") {
            inputArea.innerHTML = `<label class="sr-only" for="response">Your response</label><textarea class="response-textarea" id="response" name="response" placeholder="Write your response here."></textarea>`;
            inputArea.querySelector("textarea").value = answers[currentQuestion] || "";
        } else if (question.type === "choice") {
            inputArea.innerHTML = `<ul class="choice-list">${question.options.map((option, index) => `<li><label><input type="radio" name="response" value="${option}"><span>${String.fromCharCode(65 + index)}. ${option}</span></label></li>`).join("")}</ul>`;
            const selected = inputArea.querySelector(`input[value="${CSS.escape(answers[currentQuestion] || "")}"]`);
            if (selected) selected.checked = true;
        } else {
            inputArea.innerHTML = `<div class="scale-field"><output for="response">${answers[currentQuestion] || 5} / 10</output><input id="response" name="response" type="range" min="1" max="10" value="${answers[currentQuestion] || 5}"><div class="scale-labels"><span>1 / Low</span><span>10 / Essential</span></div></div>`;
            inputArea.querySelector("input").addEventListener("input", (event) => {
                inputArea.querySelector("output").textContent = `${event.target.value} / 10`;
            });
        }
    }

    function readAnswer() {
        const selected = inputArea.querySelector("input[name='response']:checked");
        const field = inputArea.querySelector("textarea, input[name='response']");
        return selected ? selected.value : field?.value.trim();
    }

    questionnaireForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const answer = readAnswer();
        if (!answer) {
            error.textContent = "Please provide a response before continuing.";
            return;
        }
        answers[currentQuestion] = answer;
        if (currentQuestion === questions.length - 1) {
            saveState();
            sessionStorage.setItem("questionnaireComplete", "true");
            showCompletion();
            return;
        }
        currentQuestion += 1;
        saveState();
        renderQuestion();
    });

    previous.addEventListener("click", () => {
        if (currentQuestion === 0) return;
        const answer = readAnswer();
        if (answer) answers[currentQuestion] = answer;
        currentQuestion -= 1;
        saveState();
        renderQuestion();
    });

    if (sessionStorage.getItem("questionnaireComplete") === "true") {
        showCompletion();
    } else {
        renderQuestion();
    }
}

const analysisPage = document.querySelector("#analysis-page");

if (analysisPage) {
    const profile = JSON.parse(sessionStorage.getItem("respondentProfile") || "{}");
    const answers = JSON.parse(sessionStorage.getItem("questionnaireAnswers") || "{}");
    const loading = document.querySelector("#analysis-loading");
    const results = document.querySelector("#analysis-results");
    const lineContainer = document.querySelector("#analysis-lines");
    const displayName = document.querySelector("#respondent-display-name");
    const metricList = document.querySelector("#metric-list");
    const correlationList = document.querySelector("#correlation-list");
    const analysisLines = [
        "Processing responses...",
        "Identifying recurring patterns...",
        "Calculating compatibility variables...",
        "Questioning methodological decisions...",
        "Reconsidering researcher objectivity...",
    ];

    function limitScore(score) {
        return Math.min(99, Math.max(0, score));
    }

    function calculateMetrics() {
        const scores = {
            "INTELLECTUAL CURIOSITY": 64,
            "CONVERSATIONAL DEPTH": 62,
            "HUMOR COMPATIBILITY": 65,
            "EMOTIONAL AWARENESS": 60,
            "OPENNESS TO UNEXPECTED CONNECTIONS": 58,
            "TOLERANCE FOR CHAOTIC CONVERSATIONS": 55,
        };
        const conversation = answers["1"];
        const attraction = answers["5"];
        const importance = Number(answers["6"] || 0);
        const unexpected = answers["7"];

        if (answers["0"]) scores["INTELLECTUAL CURIOSITY"] += 5;
        if (answers["2"]) scores["CONVERSATIONAL DEPTH"] += 4;
        if (answers["3"]) scores["EMOTIONAL AWARENESS"] += 5;
        if (answers["4"]) scores["EMOTIONAL AWARENESS"] += 8;

        if (conversation === "Deep philosophical discussions") {
            scores["INTELLECTUAL CURIOSITY"] += 18;
            scores["CONVERSATIONAL DEPTH"] += 20;
        } else if (conversation === "Intellectual debates") {
            scores["INTELLECTUAL CURIOSITY"] += 18;
            scores["CONVERSATIONAL DEPTH"] += 16;
        } else if (conversation === "Random nonsense at 2 AM") {
            scores["HUMOR COMPATIBILITY"] += 20;
            scores["TOLERANCE FOR CHAOTIC CONVERSATIONS"] += 22;
        } else if (conversation === "A chaotic combination of everything") {
            scores["INTELLECTUAL CURIOSITY"] += 7;
            scores["CONVERSATIONAL DEPTH"] += 7;
            scores["HUMOR COMPATIBILITY"] += 16;
            scores["TOLERANCE FOR CHAOTIC CONVERSATIONS"] += 16;
        }

        if (attraction === "Someone who makes you laugh") {
            scores["HUMOR COMPATIBILITY"] += 16;
            scores["TOLERANCE FOR CHAOTIC CONVERSATIONS"] += 4;
        } else if (attraction === "Someone who challenges your thinking") {
            scores["INTELLECTUAL CURIOSITY"] += 16;
            scores["CONVERSATIONAL DEPTH"] += 8;
        } else if (attraction === "Someone who understands you without much explanation") {
            scores["EMOTIONAL AWARENESS"] += 18;
        } else if (attraction === "Someone who makes ordinary moments fun") {
            scores["HUMOR COMPATIBILITY"] += 14;
            scores["TOLERANCE FOR CHAOTIC CONVERSATIONS"] += 6;
        } else if (attraction === "Unfortunately, all of the above") {
            scores["INTELLECTUAL CURIOSITY"] += 9;
            scores["CONVERSATIONAL DEPTH"] += 7;
            scores["HUMOR COMPATIBILITY"] += 12;
            scores["EMOTIONAL AWARENESS"] += 10;
        }

        scores["INTELLECTUAL CURIOSITY"] += importance * 2;
        scores["CONVERSATIONAL DEPTH"] += importance * 2;

        if (unexpected === "Definitely") scores["OPENNESS TO UNEXPECTED CONNECTIONS"] += 20;
        else if (unexpected === "Maybe") scores["OPENNESS TO UNEXPECTED CONNECTIONS"] += 12;
        else if (unexpected === "I'm not sure") scores["OPENNESS TO UNEXPECTED CONNECTIONS"] += 6;
        else if (unexpected === "That's suspiciously specific") scores["OPENNESS TO UNEXPECTED CONNECTIONS"] += 14;

        return Object.entries(scores).map(([name, score]) => ({ name, score: limitScore(score) }));
    }

    function createCorrelations() {
        const correlations = [];
        if (["Deep philosophical discussions", "Intellectual debates"].includes(answers["1"])) {
            correlations.push("Respondent values meaningful conversation.");
        }
        if (answers["5"] === "Someone who challenges your thinking" || answers["5"] === "Unfortunately, all of the above") {
            correlations.push("Respondent appears to appreciate people who challenge her thinking.");
        }
        if (answers["5"] === "Someone who understands you without much explanation" || answers["4"]) {
            correlations.push("Respondent places notable value on emotional understanding.");
        }
        if (["Random nonsense at 2 AM", "A chaotic combination of everything"].includes(answers["1"])) {
            correlations.push("Respondent may be unusually tolerant of chaotic humor.");
        }
        if (answers["7"] === "Definitely" || answers["7"] === "That's suspiciously specific") {
            correlations.push("Respondent remains open to the possibility of unexpected significance.");
        }
        const defaults = [
            "Respondent provided enough evidence for further conversation-based research.",
            "The available data suggests an encouraging tolerance for interesting questions.",
            "Additional observations would improve the reliability of these entirely fictional findings.",
        ];
        return [...correlations, ...defaults].slice(0, 3);
    }

    function renderResults() {
        displayName.textContent = profile.name?.trim() || "UNSPECIFIED";
        calculateMetrics().forEach((metric) => {
            const row = document.createElement("div");
            row.className = "metric-row";
            const name = document.createElement("span");
            name.className = "metric-name";
            name.textContent = metric.name;
            const value = document.createElement("div");
            value.className = "metric-value";
            const track = document.createElement("div");
            track.className = "metric-track";
            track.setAttribute("role", "progressbar");
            track.setAttribute("aria-label", metric.name);
            track.setAttribute("aria-valuemin", "0");
            track.setAttribute("aria-valuemax", "100");
            track.setAttribute("aria-valuenow", String(metric.score));
            const bar = document.createElement("div");
            bar.className = "metric-bar";
            bar.style.width = `${metric.score}%`;
            track.appendChild(bar);
            const score = document.createElement("span");
            score.className = "metric-score";
            score.textContent = `${metric.score}%`;
            value.append(track, score);
            row.append(name, value);
            metricList.appendChild(row);
            window.requestAnimationFrame(() => bar.classList.add("is-visible"));
        });

        createCorrelations().forEach((correlation) => {
            const item = document.createElement("li");
            item.textContent = correlation;
            correlationList.appendChild(item);
        });
    }

    analysisLines.forEach((line, index) => {
        const item = document.createElement("p");
        item.className = "analysis-line";
        item.textContent = line;
        lineContainer.appendChild(item);
        window.setTimeout(() => item.classList.add("is-visible"), index * 400);
    });

    window.setTimeout(() => {
        renderResults();
        loading.hidden = true;
        results.hidden = false;
    }, 2400);
}

const primarySourcePage = document.querySelector("#primary-source-page");

if (primarySourcePage) {
    const video = document.querySelector("#confession-video");
    const finalQuestion = document.querySelector("#final-question");
    const responseMessage = document.querySelector("#response-message");
    const responseChoices = document.querySelectorAll(".response-choice");

    const responseCopy = {
        yes: [
            "RESEARCH RESULT: PROMISING",
            "After extensive investigation, the researcher has determined that this is a result worth pursuing.",
            "No further statistical analysis is necessary.",
            "I'd really like the chance to get to know you more—not because I think I can convince you to like me, but because what I feel for you is genuine.",
            "Thank you for giving me a chance."
        ],

        unsure: [
            "RESEARCH RESULT: INCONCLUSIVE",
            "Further investigation is permitted.",
            "No deadline has been established. No pressure will be applied.",
            "Take your time. I meant everything I said, and I'd rather have an honest answer when you're ready than an answer you felt obligated to give.",
            "For now, the researcher remains cautiously hopeful."
        ],

        no: [
            "RESEARCH RESULT: CONCLUSIVE",
            "Hypothesis rejected.",
            "But the study was never really about getting a particular result.",
            "I meant what I said, and I'm genuinely grateful that you listened.",
            "You don't owe me a different answer, and I don't want this to make things uncomfortable between us.",
            "Thank you for being honest with me."
        ],
    };

    function showFinalQuestion() {
        if (!finalQuestion || !finalQuestion.hidden) return;
        primarySourcePage.classList.add("source-concluded");
        finalQuestion.hidden = false;
        finalQuestion.classList.add("is-revealed");
        finalQuestion.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (video) {
        video.addEventListener("ended", () => {
            window.setTimeout(showFinalQuestion, 1000);
        }, { once: true });
    }

    responseChoices.forEach((choice) => {
        choice.addEventListener("click", () => {
            const selectedResponse = choice.dataset.response;
            const copy = responseCopy[selectedResponse];

            if (!copy || !responseMessage) return;

            sessionStorage.setItem("primarySourceResponse", selectedResponse);

            responseChoices.forEach((button) => {
                button.disabled = true;
            });

            responseMessage.innerHTML = `
                <p class="response-result">${copy[0]}</p>
                ${copy.slice(1).map((line) => `<p>${line}</p>`).join("")}
                <p class="conclusion-label">STUDY CONCLUDED.</p>
                <p>Whatever the result, thank you for participating.</p>
                <p class="objectivity-footer">Researcher objectivity: permanently compromised.</p>
            `;

            responseMessage.hidden = false;
        });
    });
}
