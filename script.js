const supabase = supabase.createClient('https://hdturwmfbkbcwdyyfzao.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdHVyd21mYmtiY3dkeXlmemFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNTE5NjMsImV4cCI6MjA2MjgyNzk2M30.4skXOC9ojcKNiYo5q0ZkChYyx28z_mkI5CxNz31bofI');

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const saveProfileBtn = document.getElementById('save-profile');

loginBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  if (error) alert(error.message);
  else {
    loadUser();
  }
});

signupBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  });
  if (error) alert(error.message);
  else alert("Registrierung erfolgreich! Bitte einloggen.");
});

saveProfileBtn.addEventListener('click', async () => {
  const user = (await supabase.auth.getUser()).data.user;
  const { error } = await supabase.from('profiles').upsert({
    user_id: user.id,
    age: age.value,
    location: location.value,
    gender: gender.value,
    pet_type: pet_type.value,
    role: role.value,
  });
  if (error) alert(error.message);
  else {
    alert('Profil gespeichert!');
    if (role.value === 'owner') loadSitters();
  }
});

async function loadUser() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('profile-section').classList.remove('hidden');
}

async function loadSitters() {
  document.getElementById('match-section').classList.remove('hidden');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'sitter');
  
  const sitterList = document.getElementById('sitter-list');
  sitterList.innerHTML = '';
  data.forEach(sitter => {
    const li = document.createElement('li');
    li.textContent = `${sitter.pet_type} Sitter in ${sitter.location} (${sitter.gender}, ${sitter.age} Jahre)`;
    sitterList.appendChild(li);
  });
}
