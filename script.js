const supabaseClient = supabase.createClient(
  'https://hdturwmfbkbcwdyyfzao.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdHVyd21mYmtiY3dkeXlmemFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTE5NjMsImV4cCI6MjA2MjgyNzk2M30.4skXOC9ojcKNiYo5q0ZkChYyx28z_mkI5CxNz31bofI'
);

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const saveProfileBtn = document.getElementById('save-profile');
const pageSelect = document.getElementById('page-select');
const petForm = document.getElementById('pet-form');
const petList = document.getElementById('pet-list');

let currentUserId = null;

// Info anzeigen
function showMessage(msg) {
  const box = document.getElementById('message-box');
  box.textContent = msg;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 4000);
}

// Login
loginBtn.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  if (error) showMessage(error.message);
  else loadUser();
});

// Registrierung
signupBtn.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signUp({
    email: email.value,
    password: password.value,
  });
  if (error) showMessage(error.message);
  else showMessage("Registrierung erfolgreich! Bitte einloggen.");
});

// Profil speichern
saveProfileBtn.addEventListener('click', async () => {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;

  const { error } = await supabaseClient.from('profiles').upsert({
    user_id: user.id,
    full_name: document.getElementById('full-name').value,
    age: age.value,
    location: location.value,
    gender: gender.value,
    role: role.value,
  });

  if (error) showMessage(error.message);
  else {
    showMessage("Profil gespeichert!");
    loadUsers();
    loadSitters();
  }
});


// Navigation
pageSelect.addEventListener('change', () => {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageSelect.value).classList.remove('hidden');
});

// Tier hinzufügen
petForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('pet-name').value;
  const type = document.getElementById('pet-type').value;
  const description = document.getElementById('pet-description').value;
  const role = document.getElementById('pet-role').value;
  const file = document.getElementById('pet-image').files[0];

  let imageUrl = null;

  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) {
    showMessage("Nicht eingeloggt.");
    return;
  }
  currentUserId = user.id;

  // Bild hochladen (wenn vorhanden)
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${currentUserId}/${fileName}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from('pet-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error("❌ Upload-Fehler:", uploadError);
      showMessage("Fehler beim Hochladen: " + uploadError.message);
      return;
    }

    const { data } = supabaseClient
      .storage
      .from('pet-images')
      .getPublicUrl(filePath);

    imageUrl = data.publicUrl;
  }

  // Eintrag speichern (RLS-konform!)
  const { error } = await supabaseClient.from('pets').insert({
    owner_id: currentUserId,
    name,
    pet_type: type,
    description,
    role,
    image_url: imageUrl
  });

  if (error) {
    console.error("❌ Fehler beim Einfügen:", error);
    showMessage("Fehler beim Speichern: " + error.message);
  } else {
    showMessage("Tier hinzugefügt!");
    petForm.reset();
    loadMyPets();
  }
});

// Nutzer laden nach Login
async function loadUser() {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;
  currentUserId = user.id;

  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('page-select').classList.remove('hidden');
  document.getElementById('profile-page').classList.remove('hidden');

  await loadProfile(); // Profil anzeigen
  loadMyPets();
  loadUsers();
  loadSitters();
}

// 🔄 Profil laden und anzeigen
async function loadProfile() {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.warn("Profil nicht gefunden oder Fehler:", error);
    return;
  }

  // Felder befüllen
  document.getElementById('age').value = data.age || '';
  document.getElementById('location').value = data.location || '';
  document.getElementById('gender').value = data.gender || '';
  document.getElementById('role').value = data.role || '';
}

// Eigene Tiere laden
async function loadMyPets() {
  const { data } = await supabaseClient
    .from('pets')
    .select('*')
    .eq('owner_id', currentUserId);

  petList.innerHTML = '';
  data.forEach(pet => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${pet.name}</strong> (${pet.pet_type}) – ${pet.role}<br/>
      ${pet.description}<br/>
      ${pet.image_url ? `<img src="${pet.image_url}" alt="Tierbild" />` : ''}
      <button class="delete-btn" data-id="${pet.id}">🗑️</button>
    `;
    petList.appendChild(li);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await supabaseClient.from('pets').delete().eq('id', id);
      loadMyPets();
    });
  });
}

// Suchende anzeigen
async function loadUser() {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;
  currentUserId = user.id;

  await loadProfile(); // 👈 Diese Zeile fügt das gespeicherte Profil in die Felder ein

  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('page-select').classList.remove('hidden');
  document.getElementById('profile-page').classList.remove('hidden');

  loadMyPets();
  loadUsers();
  loadSitters();
}


// Anbieter anzeigen
async function loadSitters() {
  const { data } = await supabaseClient
    .from('pets')
    .select('*')
    .eq('role', 'sitter');

  const list = document.getElementById('sitters-list');
  list.innerHTML = '';
  data.forEach(user => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${user.name}</strong> bietet Betreuung für ${user.pet_type}<br/>
      ${user.description}<br/>
      ${user.image_url ? `<img src="${user.image_url}" />` : ''}
    `;
    list.appendChild(li);
  });
}
async function loadProfile() {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return;

  document.getElementById('full-name').value = data.full_name || '';
  document.getElementById('age').value = data.age || '';
  document.getElementById('location').value = data.location || '';
  document.getElementById('gender').value = data.gender || '';
  document.getElementById('role').value = data.role || '';
}

