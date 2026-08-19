from flask import Flask, render_template
from pathlib import Path


app = Flask(__name__)

STUDY = {
    "title": "STATISTICALLY SPEAKING",
    "subtitle": '"A peer-reviewed investigation into a statistically significant person."',
    "researcher": "Gelo (yung sobrang pogi sa buong mundo)",
    "subject": "Ikaw Malamang",
    "metadata": [
        ("FIELD", "Interpersonal Studies"),
        ("STUDY TYPE", "Qualitative / Quantitative / Emotionally Compromised"),
        ("RESEARCH STATUS", "Ongoing"),
        ("RESEARCHER BIAS", "Significant"),
        ("CONFIDENCE LEVEL", "Suspiciously High"),
        ("PEER REVIEW", "Pending"),
        ("ETHICAL APPROVAL", "Questionable"),
    ],
    "abstract": [
        "This study investigates an individual whose presence has demonstrated an unusually significant effect on the researcher's attention, curiosity, and general ability to remain objective.",
        "Through a combination of prolonged observation, conversational analysis, intellectual discourse, shared humor, and several scientifically questionable amounts of overthinking, the researcher sought to determine whether the subject's significance was merely coincidental or statistically meaningful.",
        "Preliminary findings suggest that the subject demonstrates an uncommon combination of emotional intelligence, intellectual curiosity, humor, and an ability to turn ordinary conversations into unexpectedly memorable ones.",
        "While the original hypothesis assumed that the researcher could maintain professional distance, subsequent observations indicate otherwise.",
        "The study therefore proceeds under conditions of compromised objectivity.",
    ],
    "researcher_note": [
        "At the beginning of this study, the researcher believed that the subject could be examined objectively.",
        "This assumption was later determined to be overly optimistic.",
    ],
}


@app.route("/")
def home():
    return render_template("index.html", study=STUDY)


@app.route("/study")
def study():
    return render_template("study.html", study=STUDY)


@app.route("/respondent-profile")
def respondent_profile():
    return render_template("respondent_profile.html", study=STUDY)


@app.route("/questionnaire")
def questionnaire():
    return render_template("questionnaire.html", study=STUDY)


@app.route("/analysis")
def analysis():
    return render_template("analysis.html", study=STUDY)


@app.route("/discussion")
def discussion():
    return render_template("discussion.html", study=STUDY)


@app.route("/control-group")
def control_group():
    return render_template("control_group.html", study=STUDY)


@app.route("/results")
def results():
    return render_template("results.html", study=STUDY)


@app.route("/primary-source")
def primary_source():
    video_path = Path(app.static_folder) / "videos" / "confession.mp4"
    return render_template("primary_source.html", study=STUDY, video_available=video_path.is_file())


@app.route("/methodology")
def methodology():
    return render_template("placeholder.html", study=STUDY)


if __name__ == "__main__":
    app.run(debug=True)
