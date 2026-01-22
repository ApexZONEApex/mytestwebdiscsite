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
let messagesRef = null;
let voiceChannelsRef = null;

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
        
        messagesRef = database.ref('messages');
        console.log('✅ Messages reference получен');
        
        voiceChannelsRef = database.ref('voiceChannels');
        console.log('✅ Voice channels reference получен');
        
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

// Сохранение сообщения в Firebase
function saveMessageToFirebase(channel, message) {
    if (!messagesRef) {
        console.error('❌ messagesRef не инициализирован');
        return;
    }
    
    console.log('💬 Сохранение сообщения в канал:', channel);
    
    messagesRef.child(channel).push({
        author: message.author,
        avatar: message.avatar,
        text: message.text,
        time: message.time,
        userId: message.userId,
        timestamp: Date.now()
    }).then(() => {
        console.log('✅ Сообщение сохранено');
    }).catch((error) => {
        console.error('❌ Ошибка сохранения сообщения:', error);
    });
}

// Получение сообщений канала из Firebase
function getMessagesFromFirebase(channel, callback) {
    if (!messagesRef) {
        console.error('❌ messagesRef не инициализирован');
        return;
    }
    
    console.log('📨 Подписка на сообщения канала:', channel);
    
    messagesRef.child(channel).on('value', (snapshot) => {
        const messages = [];
        
        snapshot.forEach((childSnapshot) => {
            messages.push(childSnapshot.val());
        });
        
        console.log('📬 Получено сообщений:', messages.length);
        callback(messages);
    });
}

// Добавление пользователя в голосовой канал
function joinVoiceChannelFirebase(channelName, user) {
    if (!voiceChannelsRef) {
        console.error('❌ voiceChannelsRef не инициализирован');
        return;
    }
    
    console.log('🎤 Подключение к голосовому каналу:', channelName);
    
    const userKey = user.email.replace(/[.#$[\]]/g, '_');
    voiceChannelsRef.child(channelName).child(userKey).set({
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        micEnabled: true,
        cameraEnabled: false,
        timestamp: Date.now()
    });
}

// Выход из голосового канала
function leaveVoiceChannelFirebase(channelName, user) {
    if (!voiceChannelsRef) return;
    
    console.log('🔇 Выход из голосового канала:', channelName);
    
    const userKey = user.email.replace(/[.#$[\]]/g, '_');
    voiceChannelsRef.child(channelName).child(userKey).remove();
}

// Получение участников голосового канала
function getVoiceChannelUsers(channelName, callback) {
    if (!voiceChannelsRef) return;
    
    voiceChannelsRef.child(channelName).on('value', (snapshot) => {
        const users = [];
        
        snapshot.forEach((childSnapshot) => {
            users.push(childSnapshot.val());
        });
        
        console.log('🎧 Участников в голосовом канале:', users.length);
        callback(users);
    });
}

// Обновление состояния в голосовом канале
function updateVoiceState(channelName, user, state) {
    if (!voiceChannelsRef) return;
    
    const userKey = user.email.replace(/[.#$[\]]/g, '_');
    voiceChannelsRef.child(channelName).child(userKey).update(state);
}

// Автоматическое отключение при закрытии страницы
window.addEventListener('beforeunload', disconnectFromFirebase);

// Экспорт функций
window.FirebaseSync = {
    init: initFirebase,
    updateUser: updateUserInFirebase,
    getUsers: getUsersFromFirebase,
    saveMessage: saveMessageToFirebase,
    getMessages: getMessagesFromFirebase,
    joinVoiceChannel: joinVoiceChannelFirebase,
    leaveVoiceChannel: leaveVoiceChannelFirebase,
    getVoiceChannelUsers: getVoiceChannelUsers,
    updateVoiceState: updateVoiceState,
    disconnect: disconnectFromFirebase
};

console.log('✅ FirebaseSync готов к использованию');
