const listEl = document.getElementById("profile-list");
const showAddBtn = document.getElementById("show-add-btn");
const addForm = document.getElementById("add-profile-form");
const nameInput = document.getElementById("new-name");
const passcodeInput = document.getElementById("new-passcode");
const confirmInput = document.getElementById("new-passcode-confirm");
const createBtn = document.getElementById("create-btn");
const createError = document.getElementById("create-error");

const modeHolder = document.getElementById("mode-banner-holder");
if (Backend.mode === "local") {
  modeHolder.innerHTML = '<div class="center-wrap"><span class="mode-banner">🧪 Demo mode: saved on this device only. Add your Firebase config to sync everywhere.</span></div>';
}

const AVATAR_EMOJIS = ["🦁", "🐯", "🐸", "🐵", "🦖", "🚀", "⚽", "🏀", "🎮", "🦈", "🐺", "🐲"];
function avatarFor(id) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_EMOJIS[hash % AVATAR_EMOJIS.length];
}

function renderProfiles(profiles) {
  if (!profiles.length) {
    listEl.innerHTML = '<div class="empty-state">No kids added yet. Add your first one below! 🎉</div>';
    return;
  }
  listEl.innerHTML = profiles.map((p) => `
    <a class="profile-card" href="account.html?profile=${encodeURIComponent(p.id)}">
      <span class="profile-avatar">${avatarFor(p.id)}</span>
      <span class="profile-name">${escapeHtml(p.name)}</span>
    </a>
  `).join("");
}

Backend.subscribeProfiles(renderProfiles);

showAddBtn.addEventListener("click", () => {
  addForm.style.display = addForm.style.display === "none" ? "block" : "none";
});

createBtn.addEventListener("click", async () => {
  createError.textContent = "";

  const name = nameInput.value.trim();
  const passcode = passcodeInput.value.trim();
  const confirmPasscode = confirmInput.value.trim();

  if (!name) {
    createError.textContent = "Please enter a name.";
    return;
  }
  if (!/^\d{4,6}$/.test(passcode)) {
    createError.textContent = "Passcode must be 4 to 6 digits.";
    return;
  }
  if (passcode !== confirmPasscode) {
    createError.textContent = "Passcodes don't match.";
    return;
  }

  createBtn.disabled = true;
  try {
    const id = await Backend.createProfile({ name, passcode });
    const unlocked = new Set(JSON.parse(sessionStorage.getItem("dadoUnlockedProfiles") || "[]"));
    unlocked.add(id);
    sessionStorage.setItem("dadoUnlockedProfiles", JSON.stringify([...unlocked]));
    window.location.href = `account.html?profile=${encodeURIComponent(id)}`;
  } catch (err) {
    createError.textContent = "Something went wrong. Please try again.";
    console.error(err);
    createBtn.disabled = false;
  }
});
