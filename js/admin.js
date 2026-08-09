const params = new URLSearchParams(window.location.search);
const profileId = params.get("profile");

const navTabs = document.getElementById("nav-tabs");
const profileSub = document.getElementById("profile-sub");
const lockView = document.getElementById("lock-view");
const lockNameEl = document.getElementById("lock-name");
const notFoundView = document.getElementById("not-found-view");
const adminView = document.getElementById("admin-view");
const passcodeInput = document.getElementById("passcode-input");
const passcodeError = document.getElementById("passcode-error");
const unlockBtn = document.getElementById("unlock-btn");
const adminBalanceEl = document.getElementById("admin-balance");
const titleInput = document.getElementById("title-input");
const amountInput = document.getElementById("amount-input");
const addBtn = document.getElementById("add-btn");
const subtractBtn = document.getElementById("subtract-btn");
const adminError = document.getElementById("admin-error");
const successBanner = document.getElementById("success-banner");

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
  passcodeInput.value = "";
  passcodeError.textContent = "";
}

async function unlock() {
  const ok = await Backend.verifyPasscode(profileId, passcodeInput.value);
  if (ok) {
    lockView.style.display = "none";
    adminView.style.display = "block";
    passcodeError.textContent = "";
  } else {
    passcodeError.textContent = "Nope, try again!";
    passcodeInput.value = "";
  }
}

unlockBtn.addEventListener("click", unlock);
passcodeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") unlock(); });
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

async function init() {
  if (!profileId) {
    window.location.href = "index.html";
    return;
  }

  buildNav("admin");

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
