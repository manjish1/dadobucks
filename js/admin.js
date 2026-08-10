const params = new URLSearchParams(window.location.search);
const profileId = params.get("profile");

const navTabs = document.getElementById("nav-tabs");
const profileSub = document.getElementById("profile-sub");
const lockView = document.getElementById("lock-view");
const lockNameEl = document.getElementById("lock-name");
const notFoundView = document.getElementById("not-found-view");
const adminView = document.getElementById("admin-view");
const unlockForm = document.getElementById("unlock-form");
const passcodeInput = document.getElementById("passcode-input");
const passcodeError = document.getElementById("passcode-error");
const unlockBtn = document.getElementById("unlock-btn");
const adminBalanceEl = document.getElementById("admin-balance");
const quickPicksEl = document.getElementById("quick-picks");
const titleInput = document.getElementById("title-input");
const amountInput = document.getElementById("amount-input");
const addBtn = document.getElementById("add-btn");
const subtractBtn = document.getElementById("subtract-btn");
const adminError = document.getElementById("admin-error");
const successBanner = document.getElementById("success-banner");

const QUICK_PICKS = [
  { label: "Piano dad new song", type: "credit", amount: 20 },
  { label: "Chores", type: "credit", min: 5, max: 30 },
  { label: "Laundry", type: "credit", min: 5, max: 30 },
  { label: "Extra reading 20 mins", type: "credit", amount: 20 },
  { label: "5 mins screen time", type: "debit", amount: 20 },
  { label: "1 small candy", type: "debit", amount: 15 },
  { label: "Baseball fat pack", type: "debit", amount: 200 },
  { label: "Baseball guaranteed pack", type: "debit", amount: 250 },
  { label: "Big candy", type: "debit", amount: 60 },
  { label: "New toy like flip slide", type: "debit", amount: 300 },
  { label: "10 games of flip slide", type: "debit", amount: 20 }
];

function quickPickText(pick) {
  return pick.amount != null ? `${pick.label} (${pick.amount})` : `${pick.label} (${pick.min}-${pick.max})`;
}

function selectQuickPick(btn) {
  quickPicksEl.querySelectorAll(".quick-pick-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
}

function applyQuickPick(pick, btn) {
  selectQuickPick(btn);
  titleInput.value = pick.label;
  if (pick.amount != null) {
    amountInput.value = pick.amount;
    amountInput.removeAttribute("max");
    amountInput.placeholder = "e.g. 10";
  } else {
    amountInput.value = "";
    amountInput.min = pick.min;
    amountInput.max = pick.max;
    amountInput.placeholder = `${pick.min}-${pick.max}`;
    amountInput.focus();
  }
}

function clearQuickPick(btn) {
  selectQuickPick(btn);
  titleInput.value = "";
  amountInput.value = "";
  amountInput.min = 1;
  amountInput.removeAttribute("max");
  amountInput.placeholder = "e.g. 10";
  titleInput.focus();
}

function buildQuickPicks() {
  quickPicksEl.innerHTML = QUICK_PICKS.map((pick, i) =>
    `<button type="button" class="quick-pick-btn ${pick.type}" data-index="${i}">${quickPickText(pick)}</button>`
  ).join("") + `<button type="button" class="quick-pick-btn custom" id="quick-pick-custom">✏️ Custom</button>`;

  quickPicksEl.querySelectorAll(".quick-pick-btn[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => applyQuickPick(QUICK_PICKS[Number(btn.dataset.index)], btn));
  });
  document.getElementById("quick-pick-custom").addEventListener("click", (e) => clearQuickPick(e.target));
}

const passcodeView = document.getElementById("passcode-view");
const showChangePasscodeBtn = document.getElementById("show-change-passcode-btn");
const changePasscodeForm = document.getElementById("change-passcode-form");
const newPasscodeInput = document.getElementById("new-passcode-input");
const confirmPasscodeInput = document.getElementById("confirm-passcode-input");
const passcodeChangeError = document.getElementById("passcode-change-error");
const passcodeChangeSuccess = document.getElementById("passcode-change-success");
const savePasscodeBtn = document.getElementById("save-passcode-btn");

function buildNav(active) {
  const tabs = [
    { key: "account", href: `account.html?profile=${encodeURIComponent(profileId)}`, label: "🏠 My Account" },
    { key: "history", href: `transactions.html?profile=${encodeURIComponent(profileId)}`, label: "📜 History" },
    { key: "admin", href: `admin.html?profile=${encodeURIComponent(profileId)}`, label: "🔐 Admin" },
    { key: "switch", href: "index.html", label: "👥 Switch Kid" }
  ];
  navTabs.innerHTML = tabs.map((t) => `<a href="${t.href}" class="${t.key === active ? "active" : ""}">${t.label}</a>`).join("");
}

// The admin page never trusts saved "unlocked" state — a fresh passcode
// is required on every visit so a kid can't credit himself just because
// he already unlocked the account/history pages this session.
function lockAdmin() {
  lockView.style.display = "block";
  adminView.style.display = "none";
  passcodeView.style.display = "none";
  changePasscodeForm.style.display = "none";
  newPasscodeInput.value = "";
  confirmPasscodeInput.value = "";
  passcodeChangeError.textContent = "";
  passcodeChangeSuccess.style.display = "none";
  passcodeInput.value = "";
  passcodeError.textContent = "";
}

async function unlock() {
  passcodeError.textContent = "";
  unlockBtn.disabled = true;
  try {
    const ok = await Backend.verifyPasscode(profileId, passcodeInput.value.trim());
    if (ok) {
      lockView.style.display = "none";
      adminView.style.display = "block";
      passcodeView.style.display = "block";
    } else {
      passcodeError.textContent = "Nope, try again!";
      passcodeInput.value = "";
    }
  } catch (err) {
    passcodeError.textContent = "Something went wrong. Please try again.";
    console.error(err);
  } finally {
    unlockBtn.disabled = false;
  }
}

unlockForm.addEventListener("submit", (e) => {
  e.preventDefault();
  unlock();
});
window.addEventListener("pageshow", (e) => { if (e.persisted) lockAdmin(); });

async function submit(type) {
  adminError.textContent = "";
  successBanner.style.display = "none";

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);

  if (!title) {
    adminError.textContent = "Please add a title for this transaction.";
    return;
  }
  if (!amount || amount <= 0) {
    adminError.textContent = "Please enter an amount greater than 0.";
    return;
  }

  try {
    await Backend.addTransaction(profileId, { title, amount, type });
    successBanner.textContent = type === "credit"
      ? `🎉 Added ${amount} Dado Bucks for "${title}"!`
      : `✅ Subtracted ${amount} Dado Bucks for "${title}".`;
    successBanner.style.display = "block";
    titleInput.value = "";
    amountInput.value = "";
    amountInput.min = 1;
    amountInput.removeAttribute("max");
    amountInput.placeholder = "e.g. 10";
    quickPicksEl.querySelectorAll(".quick-pick-btn").forEach((b) => b.classList.remove("selected"));
  } catch (err) {
    if (err.message === "INSUFFICIENT_FUNDS") {
      adminError.textContent = "He doesn't have enough Dado Bucks for that subtraction!";
    } else {
      adminError.textContent = "Something went wrong. Please try again.";
      console.error(err);
    }
  }
}

addBtn.addEventListener("click", () => submit("credit"));
subtractBtn.addEventListener("click", () => submit("debit"));

showChangePasscodeBtn.addEventListener("click", () => {
  changePasscodeForm.style.display = changePasscodeForm.style.display === "none" ? "block" : "none";
});

savePasscodeBtn.addEventListener("click", async () => {
  passcodeChangeError.textContent = "";
  passcodeChangeSuccess.style.display = "none";

  const newPasscode = newPasscodeInput.value.trim();
  const confirmPasscode = confirmPasscodeInput.value.trim();

  if (!/^\d{4,6}$/.test(newPasscode)) {
    passcodeChangeError.textContent = "Passcode must be 4 to 6 digits.";
    return;
  }
  if (newPasscode !== confirmPasscode) {
    passcodeChangeError.textContent = "Passcodes don't match.";
    return;
  }

  savePasscodeBtn.disabled = true;
  try {
    await Backend.changePasscode(profileId, newPasscode);
    passcodeChangeSuccess.textContent = "🔑 Passcode updated!";
    passcodeChangeSuccess.style.display = "block";
    newPasscodeInput.value = "";
    confirmPasscodeInput.value = "";
  } catch (err) {
    passcodeChangeError.textContent = "Something went wrong. Please try again.";
    console.error(err);
  } finally {
    savePasscodeBtn.disabled = false;
  }
});

async function init() {
  if (!profileId) {
    window.location.href = "index.html";
    return;
  }

  buildNav("admin");
  buildQuickPicks();

  const name = await Backend.getProfileName(profileId);
  if (!name) {
    notFoundView.style.display = "block";
    return;
  }

  profileSub.textContent = `${name}'s Admin Zone`;
  lockNameEl.textContent = name;
  lockAdmin();

  Backend.subscribeBalance(profileId, (balance) => {
    adminBalanceEl.textContent = balance;
  });
}

init();
