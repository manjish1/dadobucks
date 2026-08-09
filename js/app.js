function timeAgo(date) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function renderTxnList(el, txns) {
  if (!txns.length) {
    el.innerHTML = '<li class="empty-state">No activity yet. Go earn some Dado Bucks! 🌟</li>';
    return;
  }
  el.innerHTML = txns.map((t) => `
    <li class="txn-item">
      <span class="txn-icon">${t.type === "credit" ? "🟢" : "🔴"}</span>
      <div class="txn-info">
        <div class="txn-title">${escapeHtml(t.title)}</div>
        <div class="txn-date">${timeAgo(t.date)}</div>
      </div>
      <div class="txn-amount ${t.type}">${t.type === "credit" ? "+" : "-"}${t.amount} DB</div>
    </li>
  `).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const modeHolder = document.getElementById("mode-banner-holder");
if (modeHolder && Backend.mode === "local") {
  modeHolder.innerHTML = '<div class="center-wrap"><span class="mode-banner">🧪 Demo mode: saved on this device only. Add your Firebase config to sync everywhere.</span></div>';
}

Backend.subscribeBalance((balance) => {
  document.getElementById("balance").textContent = balance;
});

Backend.subscribeTransactions((txns) => {
  renderTxnList(document.getElementById("recent-list"), txns);
}, 5);
