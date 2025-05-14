const supabaseClient = supabase.createClient('https://hdturwmfbkbcwdyyfzao.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdHVyd21mYmtiY3dkeXlmemFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTE5NjMsImV4cCI6MjA2MjgyNzk2M30.4skXOC9ojcKNiYo5q0ZkChYyx28z_mkI5CxNz31bofI');

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const saveProfileBtn = document.getElementById('save-profile');
const pageSelect = document.getElementById('page-select');

function showMessage(msg) {
  const box = document.getElementById('message-box');
  box.textContent = msg;
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 4000);
}

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

saveProfileBtn.addEventListener('click', async () => {
  const user = (await supabaseClient.auth.getUser()).data.user;
  const { error } = await supabaseClient.from('profiles').upsert({
    user_id: user.id,
    age: age.value,
    location: location.value,
    gender: gender.value,
    pet_type: pet_type.value,
    role: role.value,
  });
  if (error) showMessage(error.message);
  else {
    showMessage("Profil gespeichert!");
    loadUsers();
    loadSitters();
  }
});

pageSelect.addEventListener('change', () => {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageSelect.value).classList.remove('hidden');
});

async function loadUser() {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('page-select').classList.remove('hidden');
  document.getElementById('profile-page').classList.remove('hidden');
  loadUsers();
  loadSitters();
}

async function loadUsers() {
  const { data } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('role', 'owner');

  const list = document.getElementById('users-list');
  list.innerHTML = '';
  data.forEach(user => {
    const li = document.createElement('li');
    li.textContent = `🐶 ${user.pet_type} | ${user.gender}, ${user.age} Jahre aus ${user.location}`;
    list.appendChild(li);
  });
}

async function loadSitters() {
  const { data } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('role', 'sitter');

  const list = document.getElementById('sitters-list');
  list.innerHTML = '';
  data.forEach(user => {
    const li = document.createElement('li');
    li.textContent = `🧍 Anbieter für ${user.pet_type} in ${user.location} (${user.gender}, ${user.age})`;
    list.appendChild(li);
  });
}
