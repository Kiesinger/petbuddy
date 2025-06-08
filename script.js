// --- Supabase Setup ---
const supabaseClient = supabase.createClient(
  'https://hdturwmfbkbcwdyyfzao.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdHVyd21mYmtiY3dkeXlmemFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTE5NjMsImV4cCI6MjA2MjgyNzk2M30.4skXOC9ojcKNiYo5q0ZkChYyx28z_mkI5CxNz31bofI'
);

// --- DOM Elements ---
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const saveProfileBtn = document.getElementById('save-profile');
const logoutBtn = document.getElementById('logout-btn');
const pageSelect = document.getElementById('page-select');
const petForm = document.getElementById('pet-form');
const petList = document.getElementById('pet-list');
const filterBtn = document.getElementById('apply-filter');
const chatSendBtn = document.getElementById('send-chat-btn');

let currentUserId = null;
let currentUserName = '';
// --- Message ---
function showMessage(msg) {
  const box = document.getElementById('message-box');
  box.textContent = msg;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 4000);
}

// --- Auth ---
loginBtn.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  if (error) showMessage(error.message);
  else loadUser();
});

signupBtn.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signUp({
    email: email.value,
    password: password.value,
  });
  if (error) showMessage(error.message);
  else showMessage("Registrierung erfolgreich! Bitte einloggen.");
});

logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

// --- Profile speichern ---
saveProfileBtn.addEventListener('click', async () => {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;

  // Werte sammeln & trimmen
  const profileName = name.value?.trim() || '';
  const profileAge = age.value?.trim() || '';
  const profileLocation = location.value?.trim() || '';
  const profileGender = gender.value?.trim() || '';
  const profileRole = role.value?.trim() || '';
  const availableFrom = document.getElementById('available-from').value;
  const availableTo = document.getElementById('available-to').value;

  // Eingaben prüfen
  if (!profileName || !profileLocation) {
    return showMessage("Name und Ort dürfen nicht leer sein.");
  }

  // Profilbild hochladen (optional)
  let imageUrl = null;
  const file = document.getElementById('profile-image').files[0];
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const { error: uploadError } = await supabaseClient.storage
      .from('profile-images')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) return showMessage('Fehler beim Hochladen: ' + uploadError.message);

    const { data: publicData } = supabaseClient.storage.from('profile-images').getPublicUrl(fileName);
    imageUrl = publicData.publicUrl;
  }

  // Profil speichern
  const { error } = await supabaseClient.from('profiles').upsert({
    user_id: user.id,
    name: profileName,
    age: profileAge,
    location: profileLocation,
    gender: profileGender,
    role: profileRole,
    available_from: availableFrom,
    available_to: availableTo,
    image_url: imageUrl
  });

  if (error) {
    showMessage(error.message);
  } else {
    showMessage("Profil gespeichert!");
    await loadProfile();
    loadUsers();
    loadSitters();
    loadBuddies();
    populateFilterOptions();
  }
});

// --- Seitenwechsel ---
pageSelect.addEventListener('change', () => {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageSelect.value).classList.remove('hidden');
});

// --- Tier speichern ---
petForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('pet-name').value;
  const type = document.getElementById('pet-type').value;
  const description = document.getElementById('pet-description').value;
  const role = document.getElementById('pet-role').value;
  const file = document.getElementById('pet-image').files[0];

  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return showMessage("Nicht eingeloggt.");
  currentUserId = user.id;

  let imageUrl = null;
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${currentUserId}/${fileName}`;
    const { error: uploadError } = await supabaseClient.storage.from('pet-images').upload(filePath, file);
    if (uploadError) return showMessage("Fehler beim Hochladen: " + uploadError.message);
    const { data } = supabaseClient.storage.from('pet-images').getPublicUrl(filePath);
    imageUrl = data.publicUrl;
  }

  const { error } = await supabaseClient.from('pets').insert({
    owner_id: currentUserId,
    name,
    pet_type: type,
    description,
    role,
    image_url: imageUrl
  });

  if (error) showMessage("Fehler beim Speichern: " + error.message);
  else {
    showMessage("Tier hinzugefügt!");
    petForm.reset();
    loadMyPets();
  }
});

// --- Hauptdaten laden ---
async function loadUser() {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;
  currentUserId = user.id;

  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('logout-btn').classList.remove('hidden');
  document.getElementById('page-select-wrapper').classList.remove('hidden');
  document.getElementById('profile-page').classList.remove('hidden');

  await loadProfile();
  loadMyPets();
  loadUsers();
  loadSitters();
  loadBuddies();
  loadChatUsers();
  populateFilterOptions();
  pollNewMessages();
}
// --- Profil laden ---
async function loadProfile() {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    showMessage("Fehler beim Laden des Profils: " + error.message);
    return;
  }

  if (data) {
    name.value = data.name ?? '';
    age.value = data.age ?? '';
    location.value = data.location ?? '';
    gender.value = data.gender ?? '';
    role.value = data.role ?? '';
    document.getElementById('available-from').value = data.available_from ?? '';
    document.getElementById('available-to').value = data.available_to ?? '';
    currentUserName = data.name ?? '';

    if (data.image_url) {
      document.getElementById('profile-preview').src = data.image_url;
    } else {
      document.getElementById('profile-preview').src = '';
    }
  }
}


// --- Meine Tiere laden ---
async function loadMyPets() {
  const { data } = await supabaseClient.from('pets').select('*').eq('owner_id', currentUserId);
  petList.innerHTML = '';
  data.forEach(pet => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${pet.name}</strong> (${pet.pet_type}) – ${pet.role}<br/>
      ${pet.description}<br/>
      ${pet.image_url ? `<img src="${pet.image_url}" />` : ''}
      <button class="delete-btn" data-id="${pet.id}">🗑️</button>`;
    petList.appendChild(li);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await supabaseClient.from('pets').delete().eq('id', btn.dataset.id);
      loadMyPets();
    });
  });
}

// --- Filteroptionen befüllen ---
async function populateFilterOptions() {
  const { data: profiles } = await supabaseClient.from('profiles').select('location');
  const locations = [...new Set(profiles.map(p => p.location).filter(Boolean))];

  const selects = ['filter-location', 'provider-filter-location'];
  selects.forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">Alle Orte</option>';
    locations.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = loc;
      sel.appendChild(opt);
    });
  });

  const { data: pets } = await supabaseClient.from('pets').select('pet_type');
  const types = [...new Set(pets.map(p => p.pet_type).filter(Boolean))];

  const typeSelects = ['filter-pet-type', 'provider-filter-pet-type'];
  typeSelects.forEach(id => {
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">Alle Tierarten</option>';
    types.forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      sel.appendChild(opt);
    });
  });
}

// --- Suchende Nutzer laden ---
async function loadUsers() {
  const { data: pets } = await supabaseClient.from('pets').select('*').eq('role', 'owner');
  const { data: profiles } = await supabaseClient.from('profiles').select('*');

  const list = document.getElementById('users-list');
  list.innerHTML = '';

  pets.forEach(pet => {
    const profile = profiles.find(p => p.user_id === pet.owner_id);
    const li = document.createElement('li');
    li.innerHTML = `<strong>${pet.name}</strong> sucht Betreuung für ${pet.pet_type}<br/>
      ${pet.description}<br/>
      Ort: ${profile?.location || '-'}<br/>
      Verfügbar: ${profile?.available_from || '-'} bis ${profile?.available_to || '-'}<br/>
      ${pet.image_url ? `<img src="${pet.image_url}" />` : ''}`;
    list.appendChild(li);
  });
}

// --- Anbieter laden ---
async function loadSitters() {
  const { data: pets } = await supabaseClient.from('pets').select('*').eq('role', 'sitter');
  const { data: profiles } = await supabaseClient.from('profiles').select('*');

  const list = document.getElementById('sitters-list');
  list.innerHTML = '';

  pets.forEach(pet => {
    const profile = profiles.find(p => p.user_id === pet.owner_id);
    const li = document.createElement('li');
    li.innerHTML = `<strong>${pet.name}</strong> bietet Betreuung für ${pet.pet_type}<br/>
      ${pet.description}<br/>
      Ort: ${profile?.location || '-'}<br/>
      Verfügbar: ${profile?.available_from || '-'} bis ${profile?.available_to || '-'}<br/>
      ${pet.image_url ? `<img src="${pet.image_url}" />` : ''}`;
    list.appendChild(li);
  });
}

// --- Chat ---
async function loadChatUsers() {
  const { data } = await supabaseClient.from('profiles').select('user_id, name');
  const select = document.getElementById('chat-user-select');
  select.innerHTML = '';
  data.forEach(user => {
    const opt = document.createElement('option');
    opt.value = user.user_id;
    opt.textContent = user.name || user.user_id;
    select.appendChild(opt);
  });
}

chatSendBtn.addEventListener('click', async () => {
  const to = document.getElementById('chat-user-select').value;
  const text = document.getElementById('chat-input').value;
  if (!text) return;

  await supabaseClient.from('messages').insert({
    sender_id: currentUserId,
    recipient_id: to,
    content: text
  });
  document.getElementById('chat-input').value = '';
  loadMessages(to);
});

document.getElementById('chat-user-select').addEventListener('change', (e) => {
  loadMessages(e.target.value);
});

async function loadMessages(otherUserId) {
  const { data: userData } = await supabaseClient.from('profiles').select('name').eq('user_id', otherUserId).maybeSingle();
  const otherUserName = userData?.name || 'Partner';

  const { data } = await supabaseClient.from('messages').select('*').or(
    `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`
  ).order('sent_at', { ascending: true });

  const box = document.getElementById('chat-messages');
  box.innerHTML = '';
  if (!data) return;
  data.forEach(msg => {
    const div = document.createElement('div');
    div.textContent = `${msg.sender_id === currentUserId ? 'Du' : otherUserName}: ${msg.content}`;
    box.appendChild(div);
  });
}

function pollNewMessages() {
  setInterval(async () => {
    const other = document.getElementById('chat-user-select').value;
    if (other) await loadMessages(other);
  }, 5000);
}

// --- Petbuddies ---
async function loadBuddies() {
  const { data } = await supabaseClient.from('profiles').select('*').neq('user_id', currentUserId);
  const list = document.getElementById('buddies-list');
  list.innerHTML = '';
  data.forEach(user => {
    const li = document.createElement('li');
    li.textContent = `${user.name || 'Unbekannt'} (${user.role || '-'}) aus ${user.location || '-'}`;
    list.appendChild(li);
  });
}

// --- Sessionprüfung ---
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    loadUser();
  }
});
