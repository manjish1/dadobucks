function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(date) {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
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

// sessionStorage can throw (private browsing, some in-app browsers), so
// treat "remembering you unlocked this profile" as best-effort — never
// let a storage failure block access after a correct passcode.
function getUnlockedSet() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem("dadoUnlockedProfiles") || "[]"));
  } catch (err) {
    console.error(err);
    return new Set();
  }
}

function markUnlocked(id) {
  try {
    const set = getUnlockedSet();
    set.add(id);
    sessionStorage.setItem("dadoUnlockedProfiles", JSON.stringify([...set]));
  } catch (err) {
    console.error(err);
  }
}
