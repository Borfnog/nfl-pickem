/*
 * NFL Pick‑Em application logic.
 *
 * This script provides a simple pick‑em game that runs entirely in the browser.
 * Games are organised by week and displayed as rows with two radio buttons—one for
 * the home team and one for the away team.  Picks and tiebreaker values are
 * persisted using localStorage so reloading the page does not lose your work.
 *
 * An admin panel allows modifying the schedule or entering winners by
 * manipulating raw JSON.  The default passphrase is “letmein”.
 */

// Default schedule with a few sample games.  Users can edit this in the admin
// panel.  Each week is keyed by a string and contains an array of game objects
// with `home` and `away` team names.
const defaultSchedule = {
  "1": [
    { home: "Cowboys", away: "Giants" },
    { home: "Packers", away: "Bears" },
    { home: "Chiefs", away: "Broncos" }
  ],
  "2": [
    { home: "Patriots", away: "Jets" },
    { home: "Vikings", away: "Lions" },
    { home: "Rams", away: "Seahawks" }
  ],
  "3": [
    { home: "Eagles", away: "Washington" },
    { home: "Steelers", away: "Bengals" },
    { home: "49ers", away: "Cardinals" }
  ]
};

// Persistent data store keys.
const KEYS = {
  schedule: "nflpickem_schedule",
  picks: "nflpickem_picks",
  results: "nflpickem_results",
  tiebreakers: "nflpickem_tiebreakers",
  userName: "nflpickem_username"
};

// In‑memory representations of the schedule, picks, results and tiebreaker values.
let schedule = {};
let picks = {};
let results = {};
let tiebreakers = {};
let importedPicks = []; // Array of { name: string, picks: object, tiebreakers: object }
let userName = "";

// DOM elements used throughout the application.  We select these once to avoid
// repeatedly querying the DOM.
const weekTabs = document.getElementById("weekTabs");
const content = document.getElementById("content");
const adminButton = document.getElementById("adminButton");
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const importFile = document.getElementById("importFile");
const leaderboardSection = document.getElementById("leaderboardSection");
const leaderboardTable = document.getElementById("leaderboardTable");
const adminPrompt = document.getElementById("adminPrompt");
const adminPassInput = document.getElementById("adminPassInput");
const adminEnterBtn = document.getElementById("adminEnterBtn");
const adminCancelBtn = document.getElementById("adminCancelBtn");
const adminSection = document.getElementById("adminSection");
const scheduleEditor = document.getElementById("scheduleEditor");
const resultsEditor = document.getElementById("resultsEditor");
const saveScheduleBtn = document.getElementById("saveScheduleBtn");
const saveResultsBtn = document.getElementById("saveResultsBtn");
const hideAdminBtn = document.getElementById("hideAdminBtn");

// Initialise application data from localStorage.  If values are missing,
// sensible defaults are used.  Prompt for a user name on first run.
function initialise() {
  try {
    schedule = JSON.parse(localStorage.getItem(KEYS.schedule)) ||
      JSON.parse(JSON.stringify(defaultSchedule));
  } catch (e) {
    schedule = JSON.parse(JSON.stringify(defaultSchedule));
  }
  try {
    picks = JSON.parse(localStorage.getItem(KEYS.picks)) || {};
  } catch (e) {
    picks = {};
  }
  try {
    results = JSON.parse(localStorage.getItem(KEYS.results)) || {};
  } catch (e) {
    results = {};
  }
  try {
    tiebreakers = JSON.parse(localStorage.getItem(KEYS.tiebreakers)) || {};
  } catch (e) {
    tiebreakers = {};
  }
  userName = localStorage.getItem(KEYS.userName) || "";
  if (!userName) {
    userName = prompt("Enter your name for the leaderboard", "Player 1") || "Player 1";
    localStorage.setItem(KEYS.userName, userName);
  }
}

// Persist current schedule, picks, results and tiebreakers to localStorage.  These
// functions wrap the localStorage API and stringify the underlying objects.
function saveSchedule() {
  localStorage.setItem(KEYS.schedule, JSON.stringify(schedule));
}
function savePicks() {
  localStorage.setItem(KEYS.picks, JSON.stringify(picks));
  localStorage.setItem(KEYS.tiebreakers, JSON.stringify(tiebreakers));
}
function saveResults() {
  localStorage.setItem(KEYS.results, JSON.stringify(results));
}

// Build clickable tabs for each week defined in the schedule.  The first week
// becomes active by default.  Clicking a tab re‑renders the content area.
function buildWeekTabs() {
  weekTabs.innerHTML = "";
  const weeks = Object.keys(schedule).sort((a, b) => parseInt(a) - parseInt(b));
  weeks.forEach((week, index) => {
    const btn = document.createElement("button");
    btn.textContent = `Week ${week}`;
    btn.addEventListener("click", () => {
      // remove active state from all tabs
      weekTabs.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderWeek(week);
    });
    if (index === 0) {
      btn.classList.add("active");
    }
    weekTabs.appendChild(btn);
  });
  // Render first week initially
  if (weeks.length > 0) {
    renderWeek(weeks[0]);
  } else {
    content.textContent = "No schedule defined.";
  }
}

// Render the game picks interface for a given week.  This function clears the
// content area and rebuilds it based on the selected week’s schedule.  It also
// applies winner highlighting if results have been entered.
function renderWeek(week) {
  content.innerHTML = "";
  const games = schedule[week] || [];
  if (!Array.isArray(games) || games.length === 0) {
    content.textContent = "No games scheduled for this week.";
    return;
  }

  // Ensure picks[week] and tiebreakers[week] exist
  if (!picks[week]) picks[week] = {};
  if (tiebreakers[week] === undefined) tiebreakers[week] = "";

  games.forEach((game, index) => {
    const row = document.createElement("div");
    row.className = "game-row";
    const label = document.createElement("div");
    label.textContent = `${game.away} at ${game.home}`;
    row.appendChild(label);
    // Option container
    const options = document.createElement("div");
    options.className = "team-option";
    ["away", "home"].forEach(side => {
      const id = `week${week}_game${index}_${side}`;
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `week${week}_game${index}`;
      input.id = id;
      input.value = side;
      input.checked = picks[week][index] === side;
      input.disabled = results[week] && results[week][index] !== undefined;
      input.addEventListener("change", () => {
        picks[week][index] = side;
        savePicks();
      });
      const lbl = document.createElement("label");
      lbl.setAttribute("for", id);
      lbl.textContent = game[side];
      options.appendChild(input);
      options.appendChild(lbl);
    });
    row.appendChild(options);
    // highlight the winning team if results are available
    if (results[week] && results[week][index] !== undefined) {
      const winnerSide = results[week][index] === 0 ? "home" : "away";
      row.classList.add("resolved");
      // Bold the winning team label
      options.querySelectorAll("label").forEach(lbl => {
        if (lbl.textContent === game[winnerSide]) {
          lbl.style.fontWeight = "bold";
        }
      });
    }
    content.appendChild(row);
  });
  // Tiebreaker input
  const tbContainer = document.createElement("div");
  tbContainer.className = "tiebreaker";
  const tbLabel = document.createElement("label");
  tbLabel.textContent = "Tiebreaker (total points for Monday game)";
  const tbInput = document.createElement("input");
  tbInput.type = "number";
  tbInput.min = "0";
  tbInput.value = tiebreakers[week] || "";
  tbInput.disabled = results[week] !== undefined;
  tbInput.addEventListener("change", () => {
    tiebreakers[week] = tbInput.value;
    savePicks();
  });
  tbContainer.appendChild(tbLabel);
  tbContainer.appendChild(tbInput);
  content.appendChild(tbContainer);

  updateLeaderboard();
}

// Compute scores for all players (current user plus any imported players).  A
// correct pick counts when the chosen side matches the result (0 for home,
// 1 for away).  Tiebreakers are not used in scoring but displayed here for
// completeness.  The leaderboard is rebuilt from scratch each time it is
// updated.
function updateLeaderboard() {
  const scores = [];
  // Only show leaderboard if results exist for at least one week
  const hasResults = Object.keys(results).some(wk => results[wk] && results[wk].length > 0);
  if (!hasResults) {
    leaderboardSection.classList.add("hidden");
    leaderboardTable.innerHTML = "";
    return;
  }
  // Compute local user's score
  let localScore = 0;
  Object.keys(results).forEach(week => {
    (results[week] || []).forEach((res, idx) => {
      if (picks[week] && picks[week][idx] !== undefined) {
        const chosen = picks[week][idx] === "home" ? 0 : 1;
        if (chosen === res) localScore++;
      }
    });
  });
  scores.push({ name: userName, correct: localScore });
  // Compute imported players scores
  importedPicks.forEach(player => {
    let score = 0;
    Object.keys(results).forEach(week => {
      const weekRes = results[week] || [];
      weekRes.forEach((res, idx) => {
        const pickSide = player.picks[week] ? player.picks[week][idx] : undefined;
        if (pickSide !== undefined) {
          const chosen = pickSide === "home" ? 0 : 1;
          if (chosen === res) score++;
        }
      });
    });
    scores.push({ name: player.name, correct: score });
  });
  // Sort descending by correct picks
  scores.sort((a, b) => b.correct - a.correct);
  // Build table
  leaderboardSection.classList.remove("hidden");
  leaderboardTable.innerHTML = "";
  const headerRow = document.createElement("tr");
  ["Player", "Correct Picks"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });
  leaderboardTable.appendChild(headerRow);
  scores.forEach(row => {
    const tr = document.createElement("tr");
    const nameTd = document.createElement("td");
    nameTd.textContent = row.name;
    const scoreTd = document.createElement("td");
    scoreTd.textContent = row.correct;
    tr.appendChild(nameTd);
    tr.appendChild(scoreTd);
    leaderboardTable.appendChild(tr);
  });
}

// Prompt the admin passphrase modal.
function showAdminPrompt() {
  adminPassInput.value = "";
  adminPrompt.classList.remove("hidden");
  adminPassInput.focus();
}

function hideAdminPrompt() {
  adminPrompt.classList.add("hidden");
}

// Enter admin mode if passphrase matches.  Admin mode reveals the schedule
// editor and results editor, each of which reflect the current state as JSON.
function handleAdminPass() {
  const pass = adminPassInput.value;
  if (pass === "letmein") {
    hideAdminPrompt();
    // Populate editors with current JSON
    scheduleEditor.value = JSON.stringify(schedule, null, 2);
    resultsEditor.value = JSON.stringify(results, null, 2);
    adminSection.classList.remove("hidden");
  } else {
    alert("Incorrect passphrase");
  }
}

function hideAdminSection() {
  adminSection.classList.add("hidden");
}

// Save schedule from JSON editor.  Invalid JSON will display an alert.
function handleSaveSchedule() {
  try {
    const newSchedule = JSON.parse(scheduleEditor.value);
    schedule = newSchedule;
    saveSchedule();
    // Reset picks and tiebreakers for new schedule
    picks = {};
    tiebreakers = {};
    savePicks();
    // Rebuild week tabs and render first
    buildWeekTabs();
    alert("Schedule saved successfully");
  } catch (err) {
    alert("Failed to parse schedule JSON: " + err.message);
  }
}

// Save results from JSON editor.  Should be an object where each week maps to
// an array of 0/1 indicating winner (0=home, 1=away).  After saving, the
// interface will re‑render and the leaderboard updated.
function handleSaveResults() {
  try {
    const newResults = JSON.parse(resultsEditor.value);
    results = newResults;
    saveResults();
    // Rerender current active week
    const activeBtn = weekTabs.querySelector("button.active");
    if (activeBtn) {
      const text = activeBtn.textContent.trim();
      const week = text.split(" ")[1];
      renderWeek(week);
    }
    alert("Results saved successfully");
  } catch (err) {
    alert("Failed to parse results JSON: " + err.message);
  }
}

// Export picks and tiebreakers as a JSON file.  The exported format
// includes the userName so that imported picks can be identified.  A
// temporary anchor element is created to trigger the download.
function handleExport() {
  const data = {
    name: userName,
    picks: picks,
    tiebreakers: tiebreakers
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${userName.replace(/\s+/g, "_")}_picks.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import a picks JSON file.  The file should contain {name, picks, tiebreakers}
// structure.  On success, the imported data is appended to the importedPicks
// array and the leaderboard updated.
function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      if (!obj.name || !obj.picks) throw new Error("Missing name or picks");
      importedPicks.push(obj);
      updateLeaderboard();
      alert(`Imported picks for ${obj.name}`);
    } catch (err) {
      alert("Failed to import picks: " + err.message);
    }
  };
  reader.readAsText(file);
  // Reset file input so the same file can be imported again if needed
  event.target.value = "";
}

// Assign event handlers once the DOM has loaded.  This ensures all elements
// referenced above exist before attaching listeners.
function attachEventListeners() {
  adminButton.addEventListener("click", showAdminPrompt);
  adminEnterBtn.addEventListener("click", handleAdminPass);
  adminCancelBtn.addEventListener("click", hideAdminPrompt);
  hideAdminBtn.addEventListener("click", hideAdminSection);
  saveScheduleBtn.addEventListener("click", handleSaveSchedule);
  saveResultsBtn.addEventListener("click", handleSaveResults);
  exportButton.addEventListener("click", handleExport);
  importButton.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", handleImportFile);
}

// Entry point: load data, build UI and attach listeners once DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
  initialise();
  buildWeekTabs();
  attachEventListeners();
});
