// Firebase конфигурация для синхронизации пользователей между устройствами
// ВАЖНО: Замените YOUR_CONFIG на свои данные из Firebase Console

const firebaseConfig = {
  apiKey: "AIzaSyC7U1Nx9TtpEgQWWTNMLO2sY2sWbDkpc1c",
  authDomain: "dfgdfgdfg-1973e.firebaseapp.com",
  databaseURL: "https://dfgdfgdfg-1973e-default-rtdb.firebaseio.com",
  projectId: "dfgdfgdfg-1973e",
  storageBucket: "dfgdfgdfg-1973e.firebasestorage.app",
  messagingSenderId: "921987023467",
  appId: "1:921987023467:web:fe94649da3f540c9cfe72e"
};
console.log('Firebase config loaded');
console.log('Database URL:', firebaseConfig.databaseURL);

// Инициализация Firebase
let database = null;
let usersRef = null;
let messagesRef = null;

function initFirebase() {
    try {
        // Проверяем наличие Firebase
        if (typeof firebase === 'undefined') {
            console.error('Firebase не загружен');
            return false;
        }
        
        // Инициализируем Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        database = firebase.database();
        usersRef = database.ref('users');
        messagesRef = database.ref('messages');
        
        console.log('Firebase инициализирован успешно');
        return true;
    } catch (error) {
        console.error('Ошибка инициализации Firebase:', error);
        return false;
    }
}

// Обновление пользователя в Firebase
function updateUserInFirebase(user) {
    if (!usersRef) {
        console.error('❌ usersRef не инициализирован');
        return;
    }
    
    console.log('📝 Попытка записать пользователя:', user.username);
    
    const userKey = user.email.replace(/[.#$[\]]/g, '_');
    usersRef.child(userKey).set({
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status || 'online',
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        console.log('✅ Пользователь успешно записан в Firebase');
    }).catch((error) => {
        console.error('❌ Ошибка записи пользователя:', error);
    });
}

// Получение всех пользователей из Firebase
function getUsersFromFirebase(callback) {
    if (!usersRef) {
        console.error('❌ usersRef не инициализирован для чтения');
        return;
    }
    
    console.log('👂 Подписка на изменения пользователей');
    
    usersRef.on('value', (snapshot) => {
        const users = [];
        const now = Date.now();
        
        console.log('📡 Получен snapshot:', snapshot.val());
        
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            
            // Проверяем активность (оффлайн если нет активности 60 секунд)
            if (user.lastSeen && (now - user.lastSeen) > 60000) {
                user.status = 'offline';
            }
            
            users.push(user);
        });
        
        console.log('👥 Обработано пользователей:', users.length);
        callback(users);
    }, (error) => {
        console.error('❌ Ошибка чтения пользователей:', error);
    });
}

// Сохранение сообщения в Firebase
function saveMessageToFirebase(channel, message) {
    if (!messagesRef) return;
    
    messagesRef.child(channel).push({
        author: message.author,
        avatar: message.avatar,
        text: message.text,
        time: message.time,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

// Получение сообщений канала из Firebase
function getMessagesFromFirebase(channel, callback) {
    if (!messagesRef) return;
    
    messagesRef.child(channel).on('value', (snapshot) => {
        const messages = [];
        
        snapshot.forEach((childSnapshot) => {
            messages.push(childSnapshot.val());
        });
        
        callback(messages);
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
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
    }
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
    disconnect: disconnectFromFirebase
};

