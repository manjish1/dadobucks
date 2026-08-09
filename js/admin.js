const lockView = document.getElementById("lock-view");
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

async function hash(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function lockAdmin() {
  lockView.style.display = "block";
  adminView.style.display = "none";
  passcodeInput.value = "";
  passcodeError.textContent = "";
}

async function unlock() {
  const enteredHash = await hash(passcodeInput.value);
  if (enteredHash === ADMIN_PASSCODE_HASH) {
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

// Always start locked — including when the page is restored from the
// back/forward cache — so a passcode is required on every visit.
lockAdmin();
window.addEventListener("pageshow", (e) => { if (e.persisted) lockAdmin(); });

Backend.subscribeBalance((balance) => {
  adminBalanceEl.textContent = balance;
});

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
    await Backend.addTransaction({ title, amount, type });
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
