const supabaseClient = supabase.createClient('https://YOUR_PROJECT.supabase.co', 'YOUR_PUBLIC_ANON_KEY');

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const saveProfileBtn = document.getElementById('save-profile');
const searchBtn = document.getElementById('search-btn');
const backBtn = document.getElementById('back-btn');

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
    if (role.value === 'owner') {
      document.getElementById('search-section').classList.remove('hidden');
      loadSitters();
    }
  }
});

searchBtn.addEventListener('click', () => {
  loadSitters(
    document.getElementById('search-location').value,
    document.getElementById('search-pet').value
  );
});

backBtn.addEventListener('click', () => {
  document.getElementById('profile-detail').classList.add('hidden');
  document.getElementById('search-section').classList.remove('hidden');
});

async function loadUser() {
  const user = (await supabaseClient.auth.getUser()).data.user;
  if (!user) return;
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('profile-section').classList.remove('hidden');
}

async function loadSitters(locationFilter = "", petFilter = "") {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('role', 'sitter');

  const sitterList = document.getElementById('sitter-list');
  sitterList.innerHTML = '';

  data
    .filter(sitter =>
      sitter.location.toLowerCase().includes(locationFilter.toLowerCase()) &&
      sitter.pet_type.toLowerCase().includes(petFilter.toLowerCase())
    )
    .forEach(sitter => {
      const li = document.createElement('li');
      li.textContent = `${sitter.pet_type} Sitter in ${sitter.location} (${sitter.gender}, ${sitter.age} Jahre)`;
      li.addEventListener('click', () => showProfileDetail(sitter));
      sitterList.appendChild(li);
    });
}

function showProfileDetail(profile) {
  document.getElementById('search-section').classList.add('hidden');
  document.getElementById('profile-detail').classList.remove('hidden');

  document.getElementById('detail-age').textContent = `Alter: ${profile.age}`;
  document.getElementById('detail-location').textContent = `Ort: ${profile.location}`;
  document.getElementById('detail-gender').textContent = `Geschlecht: ${profile.gender}`;
  document.getElementById('detail-pet').textContent = `Tierart: ${profile.pet_type}`;
}
