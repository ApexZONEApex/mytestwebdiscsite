// Загрузка данных пользователя
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {
    username: 'Пользователь',
    email: 'user@example.com',
    avatar: 'User1',
    status: 'online'
};

// Отображение текущего профиля
function displayProfile() {
    document.getElementById('profileAvatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.avatar}`;
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileTag').textContent = `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    document.getElementById('editUsername').value = currentUser.username;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editStatus').value = currentUser.status;
    
    // Обновление индикатора статуса
    const statusIndicator = document.querySelector('.status-indicator');
    statusIndicator.className = 'status-indicator ' + currentUser.status;
}

// Генерация аватаров
const avatarGrid = document.getElementById('avatarGrid');
for (let i = 1; i <= 12; i++) {
    const seed = `User${i}`;
    const avatarOption = document.createElement('div');
    avatarOption.className = 'avatar-option';
    if (seed === currentUser.avatar) {
        avatarOption.classList.add('selected');
    }
    avatarOption.innerHTML = `<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}" alt="Avatar ${i}">`;
    avatarOption.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
        avatarOption.classList.add('selected');
        currentUser.avatar = seed;
    });
    avatarGrid.appendChild(avatarOption);
}

// Сохранение изменений
document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    currentUser.username = document.getElementById('editUsername').value;
    currentUser.email = document.getElementById('editEmail').value;
    currentUser.status = document.getElementById('editStatus').value;
    
    // Обновить в текущем пользователе
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Обновить в общем списке
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const userIndex = allUsers.findIndex(u => u.email === currentUser.email);
    if (userIndex >= 0) {
        allUsers[userIndex] = currentUser;
        localStorage.setItem('allUsers', JSON.stringify(allUsers));
    }
    
    displayProfile();
    
    // Показать уведомление
    alert('Профиль успешно обновлен!');
});

displayProfile();
