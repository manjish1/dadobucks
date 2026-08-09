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

function unlock() {
  if (passcodeInput.value === ADMIN_PASSCODE) {
    lockView.style.display = "none";
    adminView.style.display = "block";
    passcodeError.textContent = "";
    sessionStorage.setItem("dadoAdminUnlocked", "1");
  } else {
    passcodeError.textContent = "Nope, try again!";
    passcodeInput.value = "";
  }
}

unlockBtn.addEventListener("click", unlock);
passcodeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") unlock(); });

if (sessionStorage.getItem("dadoAdminUnlocked") === "1") {
  lockView.style.display = "none";
  adminView.style.display = "block";
}

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
