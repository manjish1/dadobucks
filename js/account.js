const params = new URLSearchParams(window.location.search);
const profileId = params.get("profile");

const navTabs = document.getElementById("nav-tabs");
const profileSub = document.getElementById("profile-sub");
const lockView = document.getElementById("lock-view");
const lockNameEl = document.getElementById("lock-name");
const notFoundView = document.getElementById("not-found-view");
const contentView = document.getElementById("content-view");
const unlockForm = document.getElementById("unlock-form");
const passcodeInput = document.getElementById("passcode-input");
const passcodeError = document.getElementById("passcode-error");
const unlockBtn = document.getElementById("unlock-btn");

function buildNav(active) {
  const tabs = [
    { key: "account", href: `account.html?profile=${encodeURIComponent(profileId)}`, label: "🏠 My Account" },
    { key: "history", href: `transactions.html?profile=${encodeURIComponent(profileId)}`, label: "📜 History" },
    { key: "admin", href: `admin.html?profile=${encodeURIComponent(profileId)}`, label: "🔐 Admin" },
    { key: "switch", href: "index.html", label: "👥 Switch Kid" }
  ];
  navTabs.innerHTML = tabs.map((t) => `<a href="${t.href}" class="${t.key === active ? "active" : ""}">${t.label}</a>`).join("");
}

function showContent() {
  lockView.style.display = "none";
  contentView.style.display = "block";

  const modeHolder = document.getElementById("mode-banner-holder");
  if (Backend.mode === "local") {
    modeHolder.innerHTML = '<div class="center-wrap"><span class="mode-banner">🧪 Demo mode: saved on this device only. Add your Firebase config to sync everywhere.</span></div>';
  }

  Backend.subscribeBalance(profileId, (balance) => {
    document.getElementById("balance").textContent = balance;
  });

  Backend.subscribeTransactions(profileId, (txns) => {
    renderTxnList(document.getElementById("recent-list"), txns);
  }, 5);
}

async function unlock() {
  passcodeError.textContent = "";
  unlockBtn.disabled = true;
  try {
    const ok = await Backend.verifyPasscode(profileId, passcodeInput.value.trim());
    if (ok) {
      markUnlocked(profileId);
      showContent();
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

async function init() {
  if (!profileId) {
    window.location.href = "index.html";
    return;
  }

  buildNav("account");

  const name = await Backend.getProfileName(profileId);
  if (!name) {
    notFoundView.style.display = "block";
    return;
  }

  profileSub.textContent = `${name}'s Dado Bucks`;
  lockNameEl.textContent = name;

  if (getUnlockedSet().has(profileId)) {
    showContent();
  } else {
    lockView.style.display = "block";
  }
}

init();
