let members = [];
let expenses = [];

function saveData() {
  localStorage.setItem('members', JSON.stringify(members));
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

function loadData() {
  const m = localStorage.getItem('members');
  const e = localStorage.getItem('expenses');
  if (m) members = JSON.parse(m);
  if (e) expenses = JSON.parse(e);
  renderMembers();
  renderBalances();
}
function addMember() {
  const name = document.getElementById('memberName').value.trim();
  if (name && !members.includes(name)) {
    members.push(name);
    saveData();
    renderMembers();
    document.getElementById('memberName').value = '';
  }
}
function renderMembers() {
  const membersList = document.getElementById('membersList');
  const payerSelect = document.getElementById('payer');
  const sharedMembersDiv = document.getElementById('sharedMembers');
  membersList.innerHTML = members.map(m => `<div>${m}</div>`).join('');
  payerSelect.innerHTML = members.map(m => `<option>${m}</option>`).join('');
  sharedMembersDiv.innerHTML = members.map(m => `
    <label><input type="checkbox" value="${m}" /> ${m}</label>
  `).join('');
}
function addExpense() {
  const desc = document.getElementById('description').value;
  const amt = parseFloat(document.getElementById('amount').value);
  const payer = document.getElementById('payer').value;
  const sharedInputs = document.querySelectorAll('#sharedMembers input:checked');
  const sharedWith = Array.from(sharedInputs).map(i => i.value);

  if (!desc || !amt || !payer || sharedWith.length === 0) {
    alert("Please fill all fields");
    return;
  }

  const splitAmount = amt / sharedWith.length;
  const txn = sharedWith.map(member => ({
    from: member === payer ? null : member,
    to: member === payer ? null : payer,
    amount: member === payer ? 0 : splitAmount
  })).filter(txn => txn.from);

  expenses.push(...txn);
  saveData();
  renderBalances();

  document.getElementById('description').value = '';
  document.getElementById('amount').value = '';
  document.querySelectorAll('#sharedMembers input').forEach(i => i.checked = false);
}
function renderBalances() {
  const balances = {};
  members.forEach(m => balances[m] = 0);
  expenses.forEach(({ from, to, amount }) => {
    if (from && to) {
      balances[from] -= amount;
      balances[to] += amount;
    }
  });

  const balancesDiv = document.getElementById('balances');
  balancesDiv.innerHTML = "<h3>Balances:</h3>" + members.map(m => {
    const amt = balances[m];
    const color = amt < 0 ? 'red' : 'green';
    return `<div>${m}: <b style="color:${color}">${amt.toFixed(2)}</b></div>`;
  }).join('');
}
loadData();
function calculateSettlements() {
  const netBalances = {};
  members.forEach(m => netBalances[m] = 0);
  expenses.forEach(({ from, to, amount }) => {
    if (from && to) {
      netBalances[from] -= amount;
      netBalances[to] += amount;
    }
  });

  const creditors = [], debtors = [];

  for (const [person, balance] of Object.entries(netBalances)) {
    if (balance > 0) creditors.push({ person, amount: balance });
    else if (balance < 0) debtors.push({ person, amount: -balance });
  }

  // Sort to optimize transactions
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.person,
      to: creditor.person,
      amount: amount.toFixed(2)
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  renderSettlements(settlements);
}

function renderSettlements(settlements) {
  const div = document.getElementById('settlementResults');
  if (settlements.length === 0) {
    div.innerHTML = "<p>All balances are settled 🎉</p>";
    return;
  }

  div.innerHTML = settlements.map(s => 
    `<p><b>${s.from}</b> should pay <b>${s.to}</b> ₹${s.amount}</p>`
  ).join('');
}

