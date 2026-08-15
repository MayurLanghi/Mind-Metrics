const API_URL = "https://mind-metrics-1-jd9y.onrender.com/";

const COUNTRIES = [
  "Other",
  "India",
  "USA",
  "Canada",
  "Australia",
  "UK",
  "Germany",
  "Mexico",
  "Turkey",
  "France"
];

const PLATFORMS = [
  "Facebook",
  "LinkedIn",
  "Instagram",
  "Snapchat",
  "Twitter",
  "YouTube",
  "TikTok",
  "LINE",
  "KakaoTalk",
  "VKontakte",
  "WhatsApp",
  "WeChat"
];

const GAUGE_ARC_LENGTH = 314;
const GAUGE_MAX_SCORE = 10;

function fillSelect(selectEl, values) {
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select";
  placeholder.disabled = true;
  placeholder.selected = true;
  selectEl.appendChild(placeholder);

  values.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    selectEl.appendChild(opt);
  });
}

fillSelect(document.getElementById("country"), COUNTRIES);
fillSelect(document.getElementById("most_used_platform"), PLATFORMS);

const sliderIds = [
  "avg_daily_usage_hours",
  "study_hours",
  "physical_activity_hours",
  "sleep_hours_per_night"
];

sliderIds.forEach((id) => {
  const slider = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);

  slider.addEventListener("input", () => {
    out.textContent = `${parseFloat(slider.value).toFixed(1)} hrs`;
  });
});

const gaugeFill = document.getElementById("gauge-fill");
const gaugeNeedle = document.getElementById("gauge-needle");
const gaugeValue = document.getElementById("gauge-value");
const resultStatus = document.getElementById("result-status");

function zoneForScore(score) {
  if (score < 3.34) {
    return {
      name: "low",
      color: "#E37B6B",
      message:
        "This profile shows signs that could use attention. Consider more sleep, movement, and less screen time."
    };
  }

  if (score < 6.67) {
    return {
      name: "mid",
      color: "#E8AD52",
      message:
        "This profile is in a moderate range — some healthy habits, some room to improve balance."
    };
  }

  return {
    name: "high",
    color: "#6FE3C8",
    message:
      "This profile looks like it's thriving. Habits skew toward good sleep, activity, and balanced usage."
  };
}

function renderGauge(score) {
  const clamped = Math.max(0, Math.min(GAUGE_MAX_SCORE, score));
  const fraction = clamped / GAUGE_MAX_SCORE;

  const offset = GAUGE_ARC_LENGTH * (1 - fraction);
  gaugeFill.style.strokeDashoffset = offset;

  const angle = -90 + fraction * 180;
  gaugeNeedle.style.transform = `rotate(${angle}deg)`;

  const zone = zoneForScore(clamped);

  gaugeFill.style.stroke = zone.color;
  gaugeValue.style.color = zone.color;
  gaugeValue.textContent = clamped.toFixed(1);
  resultStatus.textContent = zone.message;
}

const form = document.getElementById("predict-form");
const submitBtn = document.getElementById("submit-btn");
const errorBox = document.getElementById("api-error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorBox.hidden = true;

  const formData = new FormData(form);

  const payload = {
    age: parseInt(formData.get("age"), 10),
    gender: formData.get("gender"),
    country: formData.get("country"),
    academic_level: formData.get("academic_level"),
    most_used_platform: formData.get("most_used_platform"),
    purpose_of_use: formData.get("purpose_of_use"),
    avg_daily_usage_hours: parseFloat(
      formData.get("avg_daily_usage_hours")
    ),
    daily_unlocks: parseInt(formData.get("daily_unlocks"), 10),
    study_hours: parseFloat(formData.get("study_hours")),
    physical_activity_hours: parseFloat(
      formData.get("physical_activity_hours")
    ),
    sleep_hours_per_night: parseFloat(
      formData.get("sleep_hours_per_night")
    ),
    stress_level: formData.get("stress_level")
  };

  const missing = Object.entries(payload).filter(
    ([, value]) =>
      value === "" ||
      value === null ||
      value === undefined ||
      Number.isNaN(value)
  );

  if (missing.length) {
    errorBox.textContent =
      "Please fill in every field before running a prediction.";
    errorBox.hidden = false;
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);

      throw new Error(
        errBody?.detail
          ? JSON.stringify(errBody.detail)
          : `Server responded with ${response.status}`
      );
    }

    const data = await response.json();

    renderGauge(data.predicted_mental_health_score);
  } catch (err) {
    errorBox.textContent = `Couldn't reach the prediction API. ${err.message}`;
    errorBox.hidden = false;
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);

  submitBtn.querySelector(".btn-predict__label").textContent = isLoading
    ? "Predicting…"
    : "Run prediction";
}