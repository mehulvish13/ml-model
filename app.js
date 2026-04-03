const API_URL = "/api/entries";

const state = {
    selectedProfile: "mehul",
    entries: {
        mehul: [],
        akhilesh: []
    }
};

const form = document.getElementById("entryForm");
const saveBtn = document.getElementById("saveBtn");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const paymentModeInput = document.getElementById("paymentMode");
const paidInput = document.getElementById("paid");
const messageEl = document.getElementById("message");

const mehulBtn = document.getElementById("mehulBtn");
const akhileshBtn = document.getElementById("akhileshBtn");

const mehulList = document.getElementById("mehulList");
const akhileshList = document.getElementById("akhileshList");

function setProfile(profile) {
    state.selectedProfile = profile;
    mehulBtn.classList.toggle("active", profile === "mehul");
    akhileshBtn.classList.toggle("active", profile === "akhilesh");
}

function createEntryMarkup(entry) {
    return `
    <div class="entry">
      <div><strong>Name:</strong> ${entry.name}</div>
      <div><strong>Phone:</strong> ${entry.phone}</div>
      <div><strong>Payment Mode:</strong> ${entry.paymentMode}</div>
      <div><strong>Paid:</strong> ${entry.paid}</div>
    </div>
  `;
}

function renderList(profile, element) {
    const list = state.entries[profile];

    if (!list.length) {
        element.innerHTML = '<p class="empty">No entries yet.</p>';
        return;
    }

    element.innerHTML = list.map(createEntryMarkup).join("");
}

function renderAll() {
    renderList("mehul", mehulList);
    renderList("akhilesh", akhileshList);
}

function setEntries(entries) {
    state.entries.mehul = Array.isArray(entries.mehul) ? entries.mehul : [];
    state.entries.akhilesh = Array.isArray(entries.akhilesh) ? entries.akhilesh : [];
}

async function loadStoredEntries() {
    try {
        const response = await fetch(API_URL, { cache: "no-store" });

        if (!response.ok) {
            throw new Error("Failed to load entries");
        }

        const data = await response.json();
        setEntries(data);
        renderAll();
    } catch (error) {
        messageEl.textContent = "Unable to load stored entries.";
    }
}

async function saveEntry() {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const paymentMode = paymentModeInput.value;
    const paid = paidInput.value;

    if (!name || !phone) {
        messageEl.textContent = "Please enter both name and phone.";
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        messageEl.textContent = "Phone number must be exactly 10 digits.";
        return;
    }

    const entry = {
        name,
        phone,
        paymentMode,
        paid
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            cache: "no-store",
            body: JSON.stringify({
                profile: state.selectedProfile,
                entry
            })
        });

        if (!response.ok) {
            throw new Error("Failed to save entry");
        }

        const data = await response.json();
        setEntries(data);
        renderAll();

        form.reset();
        paymentModeInput.value = "cash";
        paidInput.value = "yes";
        messageEl.textContent = "Entry saved.";
    } catch (error) {
        messageEl.textContent = "Unable to save entry.";
    }
}

mehulBtn.addEventListener("click", () => setProfile("mehul"));
akhileshBtn.addEventListener("click", () => setProfile("akhilesh"));
saveBtn.addEventListener("click", saveEntry);

renderAll();
loadStoredEntries();
setProfile("mehul");
