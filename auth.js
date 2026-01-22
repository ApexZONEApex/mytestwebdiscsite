// Переключение между формами
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');

showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Выбор аватара
let selectedAvatar = 'User1';
document.querySelectorAll('.avatar-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedAvatar = option.dataset.seed;
    });
});

// Установка первого аватара по умолчанию
document.querySelector('.avatar-option').classList.add('selected');

// Обработка регистрации
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    // Валидация
    if (!username || !email || !password) {
        alert('Пожалуйста, заполните все поля!');
        return;
    }
    
    if (username.length < 3) {
        alert('Имя пользователя должно содержать минимум 3 символа!');
        return;
    }
    
    if (password.length < 6) {
        alert('Пароль должен содержать минимум 6 символов!');
        return;
    }
    
    // Проверка email формата
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Введите корректный email адрес!');
        return;
    }
    
    // Проверка существующего пользователя
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const existingUser = allUsers.find(u => u.email === email);
    
    if (existingUser) {
        alert('Пользователь с таким email уже существует! Попробуйте войти или используйте другой email.');
        return;
    }
    
    const user = {
        username,
        email,
        password,
        avatar: selectedAvatar,
        status: 'online',
        createdAt: new Date().toISOString()
    };
    
    // Добавить в общий список
    allUsers.push(user);
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
    
    // Установить как текущего пользователя
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    alert('Регистрация успешна! Добро пожаловать в ModernChat!');
    window.location.href = 'index.html';
});

// Обработка входа
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Пожалуйста, заполните все поля!');
        return;
    }
    
    // Поиск пользователя
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const user = allUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
        alert('Неверный email или пароль! Проверьте данные или зарегистрируйтесь.');
        return;
    }
    
    // Обновить статус на онлайн
    user.status = 'online';
    const userIndex = allUsers.findIndex(u => u.email === email);
    allUsers[userIndex] = user;
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'index.html';
});
