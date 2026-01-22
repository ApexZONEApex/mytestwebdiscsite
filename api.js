// API для синхронизации пользователей между устройствами
// Использует localStorage как временное хранилище

// Ключ для синхронизации
const SYNC_KEY = 'modernchat_sync_timestamp';
const USERS_KEY = 'allUsers';
const MESSAGES_PREFIX = 'messages_';

// Функция для генерации уникального ID устройства
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// Обновление времени последней активности пользователя
function updateUserActivity() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const allUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = allUsers.findIndex(u => u.email === currentUser.email);
    
    if (userIndex >= 0) {
        allUsers[userIndex].lastActivity = Date.now();
        allUsers[userIndex].deviceId = getDeviceId();
        allUsers[userIndex].status = currentUser.status || 'online';
        localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
    }
}

// Проверка активности пользователей (считаем оффлайн если нет активности 30 секунд)
function checkUsersActivity() {
    const allUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const now = Date.now();
    const OFFLINE_THRESHOLD = 30000; // 30 секунд
    
    let updated = false;
    allUsers.forEach(user => {
        if (user.lastActivity && (now - user.lastActivity) > OFFLINE_THRESHOLD) {
            if (user.status !== 'offline') {
                user.status = 'offline';
                updated = true;
            }
        }
    });
    
    if (updated) {
        localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
    }
    
    return allUsers;
}

// Инициализация синхронизации
function initSync() {
    // Обновляем активность каждые 10 секунд
    setInterval(updateUserActivity, 10000);
    
    // Проверяем активность других пользователей каждые 5 секунд
    setInterval(() => {
        checkUsersActivity();
        // Триггерим событие для обновления UI
        window.dispatchEvent(new Event('usersUpdated'));
    }, 5000);
    
    // Первоначальное обновление
    updateUserActivity();
}

// Экспорт функций
window.ModernChatAPI = {
    getDeviceId,
    updateUserActivity,
    checkUsersActivity,
    initSync
};
