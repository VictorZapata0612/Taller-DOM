const API_URL = "/api/contacts";

const state = {
  contacts: [],
  editingId: null,
  toastTimer: null,
};

const els = {
  bootLoader: document.getElementById("boot-loader"),
  actionLoader: document.getElementById("action-loader"),
  toast: document.getElementById("toast"),
  app: document.getElementById("app"),
  form: document.getElementById("contact-form"),
  idInput: document.getElementById("contact-id"),
  firstName: document.getElementById("first-name"),
  lastName: document.getElementById("last-name"),
  phone: document.getElementById("phone"),
  city: document.getElementById("city"),
  address: document.getElementById("address"),
  genderMale: document.getElementById("gender-male"),
  genderFemale: document.getElementById("gender-female"),
  submitBtn: document.getElementById("submit-btn"),
  cancelEdit: document.getElementById("cancel-edit"),
  clearAll: document.getElementById("clear-all"),
  formMode: document.getElementById("form-mode"),
  counter: document.getElementById("counter"),
  emptyState: document.getElementById("empty-state"),
  contactList: document.getElementById("contact-list"),
  errors: {
    firstName: document.getElementById("first-name-error"),
    lastName: document.getElementById("last-name-error"),
    phone: document.getElementById("phone-error"),
    city: document.getElementById("city-error"),
    address: document.getElementById("address-error"),
    gender: document.getElementById("gender-error"),
  },
};

init();

function init() {
  bindEvents();
  simulateBootLoad(async () => {
    try {
      await loadContacts();
      renderContacts();
    } catch (error) {
      console.error(error);
      showToast("No se pudo cargar la API. Revisa que el servidor este activo.");
      state.contacts = [];
      renderContacts();
    } finally {
      showApp();
    }
  });
}

function bindEvents() {
  els.form.addEventListener("submit", handleSubmit);
  els.contactList.addEventListener("click", handleListActions);
  els.cancelEdit.addEventListener("click", resetFormToCreateMode);
  els.clearAll.addEventListener("click", clearAllContacts);
}

function simulateBootLoad(callback) {
  window.setTimeout(callback, 700);
}

function showApp() {
  els.bootLoader.classList.add("hidden");
  els.app.classList.remove("hidden");
  els.app.setAttribute("aria-hidden", "false");
}

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors();

  const contactData = readFormData();
  const validation = validateContact(contactData);

  if (!validation.valid) {
    showErrors(validation.errors);
    return;
  }

  try {
    await withActionLoader(async () => {
      let message = "Contacto agregado correctamente.";

      if (state.editingId === null) {
        const savedContact = await createContact(contactData);
        state.contacts.unshift(savedContact);
      } else {
        const updatedContact = await updateContact(state.editingId, contactData);
        state.contacts = state.contacts.map((contact) =>
          contact.id === updatedContact.id ? updatedContact : contact,
        );
        message = "Contacto actualizado correctamente.";
      }

      renderContacts();
      resetFormToCreateMode();
      showToast(message);
    });
  } catch (error) {
    console.error(error);
    showToast("No se pudo guardar el contacto.");
  }
}

function readFormData() {
  return {
    firstName: els.firstName.value.trim(),
    lastName: els.lastName.value.trim(),
    phone: els.phone.value.trim(),
    city: els.city.value.trim(),
    address: els.address.value.trim(),
    gender: getSelectedGender(),
  };
}

function getSelectedGender() {
  if (els.genderMale.checked) {
    return "masculino";
  }

  if (els.genderFemale.checked) {
    return "femenino";
  }

  return "";
}

function validateContact(contact) {
  const errors = {};

  if (!contact.firstName) errors.firstName = "El nombre es obligatorio.";
  if (!contact.lastName) errors.lastName = "El apellido es obligatorio.";
  if (!contact.phone) errors.phone = "El telefono es obligatorio.";
  if (!contact.city) errors.city = "La ciudad es obligatoria.";
  if (!contact.address) errors.address = "La direccion es obligatoria.";
  if (!contact.gender) errors.gender = "Selecciona un género.";

  if (contact.phone && !/^[0-9+\-\s()]{7,20}$/.test(contact.phone)) {
    errors.phone = "Telefono invalido.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function showErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    if (els.errors[field]) {
      els.errors[field].textContent = message;
    }
  });
}

function clearErrors() {
  Object.values(els.errors).forEach((errorEl) => {
    errorEl.textContent = "";
  });
}

function renderContacts() {
  els.contactList.textContent = "";

  if (state.contacts.length === 0) {
    els.emptyState.classList.remove("hidden");
  } else {
    els.emptyState.classList.add("hidden");
  }

  const fragment = document.createDocumentFragment();

  state.contacts.forEach((contact) => {
    const card = createContactCard(contact);
    fragment.appendChild(card);
  });

  els.contactList.appendChild(fragment);
  els.counter.textContent = `${state.contacts.length} contactos`;
  els.clearAll.classList.toggle("hidden", state.contacts.length === 0);
}

function createContactCard(contact) {
  const card = document.createElement("article");
  card.className = "contact-card";
  card.dataset.id = String(contact.id);

  const avatar = document.createElement("div");
  avatar.className = `avatar ${contact.gender}`;
  avatar.textContent = contact.gender === "femenino" ? "♀" : "♂";

  const main = document.createElement("div");
  main.className = "contact-main";

  const name = document.createElement("h3");
  name.className = "contact-name";
  name.textContent = `${contact.firstName} ${contact.lastName} - ${contact.city}`;

  const subtitle = document.createElement("p");
  subtitle.className = "contact-subtitle";
  subtitle.textContent = `Tel: ${contact.phone}`;

  const genderBadge = document.createElement("span");
  genderBadge.className = `gender-badge ${contact.gender}`;
  genderBadge.textContent = contact.gender === "masculino" ? "Masculino" : "Femenino";

  const meta = document.createElement("ul");
  meta.className = "contact-meta";

  meta.appendChild(createMetaRow("Telefono", contact.phone));
  meta.appendChild(createMetaRow("Ciudad", contact.city));
  meta.appendChild(createMetaRow("Direccion", contact.address));

  main.appendChild(name);
  main.appendChild(subtitle);
  main.appendChild(genderBadge);
  main.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "contact-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "icon-btn edit";
  editBtn.dataset.action = "edit";
  editBtn.textContent = "✏ Editar";
  editBtn.ariaLabel = "Editar contacto";
  editBtn.title = "Editar";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "icon-btn delete";
  deleteBtn.dataset.action = "delete";
  deleteBtn.textContent = "🗑 Eliminar";
  deleteBtn.ariaLabel = "Eliminar contacto";
  deleteBtn.title = "Eliminar";

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(avatar);
  card.appendChild(main);
  card.appendChild(actions);

  return card;
}

function createMetaRow(label, value) {
  const item = document.createElement("li");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;

  item.appendChild(strong);
  item.appendChild(document.createTextNode(value));
  return item;
}

async function handleListActions(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const card = button.closest("[data-id]");
  if (!card) return;

  const id = Number(card.dataset.id);

  if (button.dataset.action === "edit") {
    startEditContact(id);
    return;
  }

  if (button.dataset.action === "delete") {
    const confirmed = window.confirm("Seguro que quieres eliminar este contacto?");
    if (!confirmed) return;

    try {
      await withActionLoader(async () => {
        await deleteContact(id);
        state.contacts = state.contacts.filter((contact) => contact.id !== id);
        renderContacts();

        if (state.editingId === id) {
          resetFormToCreateMode();
        }

        showToast("Contacto eliminado correctamente.");
      });
    } catch (error) {
      console.error(error);
      showToast("No se pudo eliminar el contacto.");
    }
  }
}

function startEditContact(id) {
  const contact = state.contacts.find((item) => item.id === id);
  if (!contact) return;

  state.editingId = id;

  els.idInput.value = String(contact.id);
  els.firstName.value = contact.firstName;
  els.lastName.value = contact.lastName;
  els.phone.value = contact.phone;
  els.city.value = contact.city;
  els.address.value = contact.address;

  if (contact.gender === "masculino") {
    els.genderMale.checked = true;
    els.genderFemale.checked = false;
  } else {
    els.genderFemale.checked = true;
    els.genderMale.checked = false;
  }

  els.formMode.textContent = "Modo editar";
  els.submitBtn.textContent = "Actualizar contacto";
  els.cancelEdit.classList.remove("hidden");
  els.firstName.focus();
}

function resetFormToCreateMode() {
  state.editingId = null;
  els.form.reset();
  els.idInput.value = "";
  clearErrors();

  els.formMode.textContent = "Modo crear";
  els.submitBtn.textContent = "AGREGAR";
  els.cancelEdit.classList.add("hidden");
}

async function clearAllContacts() {
  if (state.contacts.length === 0) return;

  const confirmed = window.confirm("Se eliminaran todos los contactos. Continuar?");
  if (!confirmed) return;

  try {
    await withActionLoader(async () => {
      await deleteAllContacts();
      state.contacts = [];
      renderContacts();
      resetFormToCreateMode();
      showToast("Se eliminaron todos los contactos.");
    });
  } catch (error) {
    console.error(error);
    showToast("No se pudieron eliminar todos los contactos.");
  }
}

async function loadContacts() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los contactos");
  }

  const data = await response.json();
  state.contacts = Array.isArray(data)
    ? data.map((item) => ({
        id: Number(item.id),
        firstName: String(item.firstName || ""),
        lastName: String(item.lastName || ""),
        phone: String(item.phone || ""),
        city: String(item.city || ""),
        address: String(item.address || ""),
        gender: item.gender === "femenino" ? "femenino" : "masculino",
      }))
    : [];
}

async function createContact(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear el contacto");
  }

  const savedContact = await response.json();
  return {
    id: Number(savedContact.id),
    firstName: String(savedContact.firstName || ""),
    lastName: String(savedContact.lastName || ""),
    phone: String(savedContact.phone || ""),
    city: String(savedContact.city || ""),
    address: String(savedContact.address || ""),
    gender: savedContact.gender === "femenino" ? "femenino" : "masculino",
  };
}

async function updateContact(id, data) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el contacto");
  }

  const updatedContact = await response.json();
  return {
    id: Number(updatedContact.id),
    firstName: String(updatedContact.firstName || ""),
    lastName: String(updatedContact.lastName || ""),
    phone: String(updatedContact.phone || ""),
    city: String(updatedContact.city || ""),
    address: String(updatedContact.address || ""),
    gender: updatedContact.gender === "femenino" ? "femenino" : "masculino",
  };
}

async function deleteContact(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("No se pudo eliminar el contacto");
  }
}

async function deleteAllContacts() {
  const response = await fetch(API_URL, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("No se pudieron eliminar los contactos");
  }
}

function withActionLoader(work) {
  els.actionLoader.classList.remove("hidden");

  return new Promise((resolve, reject) => {
    window.setTimeout(async () => {
      try {
        resolve(await work());
      } catch (error) {
        reject(error);
      } finally {
        els.actionLoader.classList.add("hidden");
      }
    }, 280);
  });
}

function showToast(message) {
  if (state.toastTimer) {
    window.clearTimeout(state.toastTimer);
  }

  els.toast.textContent = message;
  els.toast.classList.remove("hidden");

  state.toastTimer = window.setTimeout(() => {
    els.toast.classList.add("hidden");
  }, 1800);
}