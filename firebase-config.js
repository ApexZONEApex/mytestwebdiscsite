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
let firebaseInitialized = false;
let currentMessageListener = null; // Для отслеживания текущей подписки на сообщения

// Кодирование имени канала для Firebase (кириллица и спецсимволы)
function encodeChannelName(name) {
    return encodeURIComponent(name).replace(/[.#$[\]]/g, '_');
}

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

        firebaseInitialized = true;
        console.log('🎯 Firebase полностью инициализирован');

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

    const encodedChannel = encodeChannelName(channel);
    console.log('💬 Сохранение сообщения в канал:', channel, '(encoded:', encodedChannel, ')');

    messagesRef.child(encodedChannel).push({
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

    const encodedChannel = encodeChannelName(channel);
    console.log('📨 Подписка на сообщения канала:', channel, '(encoded:', encodedChannel, ')');

    // Отписаться от предыдущего канала если есть
    if (currentMessageListener) {
        console.log('🔇 Отписка от предыдущего канала');
        currentMessageListener.ref.off('value', currentMessageListener.callback);
    }

    const channelRef = messagesRef.child(encodedChannel);
    const listenerCallback = (snapshot) => {
        const messages = [];

        snapshot.forEach((childSnapshot) => {
            messages.push(childSnapshot.val());
        });

        console.log('📬 Получено сообщений:', messages.length);
        callback(messages);
    };

    // Сохранить ссылку на listener для последующей отписки
    currentMessageListener = {
        ref: channelRef,
        callback: listenerCallback
    };

    channelRef.on('value', listenerCallback);
}

// Добавление пользователя в голосовой канал
function joinVoiceChannelFirebase(channelName, user) {
    if (!voiceChannelsRef) {
        console.error('❌ voiceChannelsRef не инициализирован');
        return;
    }

    const encodedChannel = encodeChannelName(channelName);
    console.log('🎤 Подключение к голосовому каналу:', channelName, '(encoded:', encodedChannel, ')');

    const userKey = user.email.replace(/[.#$[\]]/g, '_');
    const userRef = voiceChannelsRef.child(encodedChannel).child(userKey);

    // Устанавливаем данные пользователя
    userRef.set({
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        micEnabled: true,
        cameraEnabled: false,
        timestamp: Date.now()
    });

    // ВАЖНО: Автоматически удалить пользователя при отключении от Firebase
    userRef.onDisconnect().remove();
    console.log('🔌 Установлен onDisconnect для автоматического удаления при отключении');
}

// Выход из голосового канала
function leaveVoiceChannelFirebase(channelName, user) {
    if (!voiceChannelsRef) return;

    const encodedChannel = encodeChannelName(channelName);
    console.log('🔇 Выход из голосового канала:', channelName);

    const userKey = user.email.replace(/[.#$[\]]/g, '_');
    voiceChannelsRef.child(encodedChannel).child(userKey).remove();
}

// Хранение активных слушателей
let currentVoiceChannelListener = null;
let currentVoiceChannelPath = null;

// Получение участников голосового канала
function getVoiceChannelUsers(channelName, callback) {
    if (!voiceChannelsRef) return;

    // Если уже есть слушатель на этом канале, не создаем новый
    if (currentVoiceChannelPath === channelName && currentVoiceChannelListener) {
        console.log('ℹ️ Слушатель для этого канала уже активен');
        return;
    }

    // Отписываемся от предыдущего, если есть
    if (currentVoiceChannelListener && currentVoiceChannelPath) {
        unsubscribeFromVoiceChannel();
    }

    const encodedChannel = encodeChannelName(channelName);
    const channelRef = voiceChannelsRef.child(encodedChannel);

    currentVoiceChannelPath = channelName;
    currentVoiceChannelListener = channelRef.on('value', (snapshot) => {
        const users = [];
        const now = Date.now();
        const maxAge = 60000;

        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            if (user.timestamp && (now - user.timestamp) < maxAge) {
                users.push(user);
            }
        });

        console.log('🎧 Слушатель канала получил обновление:', users.length, 'участников');
        callback(users);
    });
}

// Отписка от слушателя голосового канала
function unsubscribeFromVoiceChannel() {
    if (currentVoiceChannelListener && currentVoiceChannelPath && voiceChannelsRef) {
        const encodedChannel = encodeChannelName(currentVoiceChannelPath);
        voiceChannelsRef.child(encodedChannel).off('value', currentVoiceChannelListener);
        console.log('🔕 Отписка от голосового канала:', currentVoiceChannelPath);
        currentVoiceChannelListener = null;
        currentVoiceChannelPath = null;
    }
}

// Подписка на ВСЕ голосовые каналы для отображения участников в боковой панели
function subscribeToAllVoiceChannels(callback) {
    if (!voiceChannelsRef) return;

    console.log('📡 Подписка на все голосовые каналы');
    voiceChannelsRef.on('value', (snapshot) => {
        const channels = {};
        const now = Date.now();
        const maxAge = 60000; // 60 секунд максимум неактивности

        snapshot.forEach((channelSnapshot) => {
            const channelName = channelSnapshot.key;
            const users = [];

            channelSnapshot.forEach((userSnapshot) => {
                const user = userSnapshot.val();

                // Проверяем, не устарел ли пользователь
                if (user.timestamp && (now - user.timestamp) < maxAge) {
                    users.push(user);
                } else if (user.timestamp && (now - user.timestamp) >= maxAge) {
                    // Автоматически удаляем устаревшего пользователя
                    console.log('🧹 Удаление устаревшего пользователя из голосового канала:', user.username);
                    userSnapshot.ref.remove();
                }
            });

            if (users.length > 0) {
                channels[channelName] = users;
            }
        });

        console.log('📊 Голосовые каналы обновлены:', Object.keys(channels).length, 'каналов');
        callback(channels);
    });
}

// Обновление состояния в голосовом канале
function updateVoiceState(channelName, user, state) {
    if (!voiceChannelsRef) return;

    const encodedChannel = encodeChannelName(channelName);
    const userKey = user.email.replace(/[.#$[\]]/g, '_');
    voiceChannelsRef.child(encodedChannel).child(userKey).update(state);
}

// Автоматическое отключение при закрытии страницы
window.addEventListener('beforeunload', disconnectFromFirebase);

// Экспорт функций
window.FirebaseSync = {
    init: initFirebase,
    isReady: () => firebaseInitialized,
    updateUser: updateUserInFirebase,
    getUsers: getUsersFromFirebase,
    saveMessage: saveMessageToFirebase,
    getMessages: getMessagesFromFirebase,
    joinVoiceChannel: joinVoiceChannelFirebase,
    leaveVoiceChannel: leaveVoiceChannelFirebase,
    getVoiceChannelUsers: getVoiceChannelUsers,
    unsubscribeFromVoiceChannel: unsubscribeFromVoiceChannel,
    subscribeToAllVoiceChannels: subscribeToAllVoiceChannels,
    updateVoiceState: updateVoiceState,
    disconnect: disconnectFromFirebase
};

console.log('✅ FirebaseSync готов к использованию');
