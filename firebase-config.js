// Firebase конфигурация для синхронизации пользователей между устройствами

const firebaseConfig = {
  apiKey: "AIzaSyC7U1Nx9TtpEgQWWTNMLO2sY2sWbDkpc1c",
  authDomain: "dfgdfgdfg-1973e.firebaseapp.com",
  databaseURL: "https://dfgdfgdfg-1973e-default-rtdb.firebaseio.com",
  projectId: "dfgdfgdfg-1973e",
  storageBucket: "dfgdfgdfg-1973e.firebasestorage.app",
  messagingSenderId: "921987023467",
  appId: "1:921987023467:web:fe94649da3f540c9cfe72e"
};

console.log('🔧 Firebase config loaded');
console.log('🌐 Database URL:', firebaseConfig.databaseURL);

// Глобальные переменные
let database = null;
let usersRef = null;

// Инициализация Firebase
function initFirebase() {
    try {
        console.log('🚀 Начало инициализации Firebase...');
        
        // Проверяем наличие Firebase
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK не загружен!');
            return false;
        }
        console.log('✅ Firebase SDK загружен');
        
        // Инициализируем Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase приложение инициализировано');
        } else {
            console.log('ℹ️ Firebase приложение уже инициализировано');
        }
        
        // Получаем ссылку на базу данных
        database = firebase.database();
        console.log('✅ Database reference получен');
        
        usersRef = database.ref('users');
        console.log('✅ Users reference получен');
        
        // Тестовая запись
        testFirebaseConnection();
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        console.error('Детали ошибки:', error.message);
        return false;
    }
}

// Тестовое подключение
function testFirebaseConnection() {
    console.log('🧪 Тестирование подключения к Firebase...');
    
    database.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === true) {
            console.log('✅ Подключение к Firebase установлено!');
        } else {
            console.log('⚠️ Нет подключения к Firebase');
        }
    });
}

// Обновление пользователя в Firebase
function updateUserInFirebase(user) {
    if (!usersRef) {
        console.error('❌ usersRef не инициализирован');
        return;
    }
    
    console.log('� Запись пользователя:', user.username, '(' + user.email + ')');
    
    const userKey = user.email.replace(/[.#$[\]]/g, '_');
    const userData = {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status || 'online',
        lastSeen: Date.now()
    };
    
    console.log('📦 Данные для записи:', userData);
    
    usersRef.child(userKey).set(userData)
        .then(() => {
            console.log('✅ Пользователь успешно записан в Firebase!');
        })
        .catch((error) => {
            console.error('❌ Ошибка записи пользователя:', error);
            console.error('Код ошибки:', error.code);
            console.error('Сообщение:', error.message);
        });
}

// Получение всех пользователей из Firebase
function getUsersFromFirebase(callback) {
    if (!usersRef) {
        console.error('❌ usersRef не инициализирован для чтения');
        return;
    }
    
    console.log('👂 Подписка на изменения пользователей...');
    
    usersRef.on('value', (snapshot) => {
        const users = [];
        const now = Date.now();
        const data = snapshot.val();
        
        console.log('📡 Получены данные из Firebase:', data);
        
        if (!data) {
            console.log('ℹ️ База данных пуста');
            callback([]);
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            
            // Проверяем активность (оффлайн если нет активности 60 секунд)
            if (user.lastSeen && (now - user.lastSeen) > 60000) {
                user.status = 'offline';
            }
            
            users.push(user);
        });
        
        console.log('👥 Найдено пользователей:', users.length);
        users.forEach(u => console.log('  - ' + u.username + ' (' + u.status + ')'));
        
        callback(users);
    }, (error) => {
        console.error('❌ Ошибка чтения пользователей:', error);
        console.error('Код ошибки:', error.code);
        console.error('Сообщение:', error.message);
    });
}

// Отключение от Firebase при выходе
function disconnectFromFirebase() {
    if (!usersRef) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const userKey = currentUser.email.replace(/[.#$[\]]/g, '_');
        usersRef.child(userKey).update({
            status: 'offline',
            lastSeen: Date.now()
        });
        console.log('👋 Пользователь отключен от Firebase');
    }
}

// Автоматическое отключение при закрытии страницы
window.addEventListener('beforeunload', disconnectFromFirebase);

// Экспорт функций
window.FirebaseSync = {
    init: initFirebase,
    updateUser: updateUserInFirebase,
    getUsers: getUsersFromFirebase,
    disconnect: disconnectFromFirebase
};

console.log('✅ FirebaseSync готов к использованию');
