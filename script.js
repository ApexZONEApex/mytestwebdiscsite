// ============================================
// СИСТЕМА ПОЛЬЗОВАТЕЛЕЙ
// ============================================

// Проверка авторизации
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    // Перенаправление на страницу авторизации
    window.location.href = 'auth.html';
    throw new Error('Пользователь не авторизован');
}

// Получение всех зарегистрированных пользователей
function getAllUsers() {
    const users = JSON.parse(localStorage.getItem('allUsers') || '[]');
    return users;
}

// Добавление текущего пользователя в список всех пользователей
function registerCurrentUser() {
    let allUsers = getAllUsers();
    const existingIndex = allUsers.findIndex(u => u.email === currentUser.email);

    if (existingIndex >= 0) {
        allUsers[existingIndex] = currentUser;
    } else {
        allUsers.push(currentUser);
    }

    localStorage.setItem('allUsers', JSON.stringify(allUsers));
}

registerCurrentUser();

// Обновление информации о текущем пользователе
function updateUserInfo() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('currentUserAvatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.avatar}`;
        document.getElementById('currentUsername').textContent = currentUser.username;
        document.getElementById('currentUserTag').textContent = `#${currentUser.email.split('@')[0].slice(0, 4).padStart(4, '0')}`;

        const statusIndicator = document.getElementById('currentUserStatus');
        statusIndicator.className = 'status-indicator ' + (currentUser.status || 'online');

        registerCurrentUser();
        updateMembersList();
    }
}

updateUserInfo();

// Обновление списка участников
function updateMembersList() {
    // Если Firebase доступен, используем его
    if (window.FirebaseSync && typeof firebase !== 'undefined') {
        window.FirebaseSync.getUsers((users) => {
            displayMembers(users);
        });
    } else {
        // Иначе используем localStorage
        const allUsers = window.ModernChatAPI ?
            window.ModernChatAPI.checkUsersActivity() :
            getAllUsers();
        displayMembers(allUsers);
    }
}

function displayMembers(allUsers) {
    const onlineContainer = document.getElementById('onlineMembers');
    const offlineContainer = document.getElementById('offlineMembers');

    // Очистка
    onlineContainer.innerHTML = '<div class="members-header">ОНЛАЙН — <span id="onlineCount">0</span></div>';
    offlineContainer.innerHTML = '<div class="members-header">ОФФЛАЙН — <span id="offlineCount">0</span></div>';

    let onlineCount = 0;
    let offlineCount = 0;

    allUsers.forEach(user => {
        const isOnline = user.status === 'online';
        const memberDiv = document.createElement('div');
        memberDiv.className = 'member' + (isOnline ? '' : ' offline');
        memberDiv.innerHTML = `
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}" alt="Avatar" class="member-avatar">
            <div class="status-indicator ${user.status || 'offline'}"></div>
            <span class="member-name">${user.username}</span>
        `;

        if (isOnline) {
            onlineContainer.appendChild(memberDiv);
            onlineCount++;
        } else {
            offlineContainer.appendChild(memberDiv);
            offlineCount++;
        }
    });

    document.getElementById('onlineCount').textContent = onlineCount;
    document.getElementById('offlineCount').textContent = offlineCount;
}

// ============================================
// СИСТЕМА СООБЩЕНИЙ
// ============================================

// Получение сообщений из localStorage
function getChannelMessages(channelName) {
    const key = `messages_${channelName}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

// Сохранение сообщений в localStorage
function saveChannelMessages(channelName, messages) {
    const key = `messages_${channelName}`;
    localStorage.setItem(key, JSON.stringify(messages));
}

let currentChannel = 'общий';

// Отображение сообщений канала
function displayChannelMessages(channelName) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';

    // Если Firebase доступен, используем его
    if (window.FirebaseSync && typeof firebase !== 'undefined') {
        // Отписываемся от предыдущего канала
        if (window.currentChannelListener) {
            // Firebase автоматически управляет подписками
        }

        window.FirebaseSync.getMessages(channelName, (messages) => {
            messagesContainer.innerHTML = '';

            if (messages.length === 0) {
                showEmptyChannel(channelName);
                return;
            }

            messages.forEach(msg => {
                addMessageToDOM(msg);
            });

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    } else {
        // Используем localStorage
        const messages = getChannelMessages(channelName);

        if (messages.length === 0) {
            showEmptyChannel(channelName);
            return;
        }

        messages.forEach(msg => {
            addMessageToDOM(msg);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function showEmptyChannel(channelName) {
    const messagesContainer = document.getElementById('messagesContainer');
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-channel';
    emptyDiv.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <h3>Добро пожаловать в #${channelName}!</h3>
        <p>Это начало канала #${channelName}. Начните общение!</p>
    `;
    messagesContainer.appendChild(emptyDiv);
}

function addMessageToDOM(msg) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.avatar}" alt="Avatar" class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${msg.author}</span>
                <span class="message-time">${msg.time}</span>
            </div>
            <div class="message-text">${msg.text}</div>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
}

// Отправка сообщения
const messageInput = document.getElementById('messageInput');

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim()) {
        sendMessage(messageInput.value);
        messageInput.value = '';
    }
});

function sendMessage(text) {
    const now = new Date();
    const time = `Сегодня в ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    const message = {
        author: currentUser.username,
        avatar: currentUser.avatar,
        time: time,
        text: escapeHtml(text),
        userId: currentUser.email
    };

    console.log('📤 Отправка сообщения:', message);
    console.log('📍 Текущий канал:', currentChannel);
    console.log('🔥 Firebase доступен:', !!(window.FirebaseSync && typeof firebase !== 'undefined'));

    // Если Firebase доступен, используем его
    if (window.FirebaseSync && typeof firebase !== 'undefined') {
        console.log('✅ Используем Firebase для сообщения');
        window.FirebaseSync.saveMessage(currentChannel, message);
    } else {
        console.log('⚠️ Используем localStorage для сообщения');
        // Иначе используем localStorage
        const messages = getChannelMessages(currentChannel);
        messages.push(message);
        saveChannelMessages(currentChannel, messages);
        displayChannelMessages(currentChannel);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ КАНАЛОВ
// ============================================

document.querySelectorAll('.channel:not(.voice)').forEach(channel => {
    channel.addEventListener('click', () => {
        const channelName = channel.dataset.channel;
        if (channelName) {
            document.querySelectorAll('.channel:not(.voice)').forEach(ch => ch.classList.remove('active'));
            channel.classList.add('active');

            currentChannel = channelName;
            displayChannelMessages(channelName);

            document.querySelector('.channel-info h3').textContent = channelName;
            document.querySelector('.message-input').placeholder = `Написать сообщение в #${channelName}`;
        }
    });
});

// ============================================
// WEBRTC ГОЛОСОВОЙ ЧАТ
// ============================================

let localStream = null;
let screenStream = null;
let peerConnections = {};
let inVoiceChannel = false;
let currentVoiceChannel = null;
let micEnabled = true;
let cameraEnabled = false;
let screenEnabled = false;

// Обработчик голосовых каналов
document.querySelectorAll('.channel.voice').forEach(voiceChannel => {
    voiceChannel.addEventListener('click', () => {
        const voiceChannelName = voiceChannel.querySelector('span').textContent;

        if (inVoiceChannel && currentVoiceChannel === voiceChannelName) {
            leaveVoiceChannel();
        } else {
            joinVoiceChannel(voiceChannelName, voiceChannel);
        }
    });
});

let voiceHeartbeatInterval = null;

async function joinVoiceChannel(channelName, channelElement) {
    try {
        // Запрос доступа к микрофону
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });

        inVoiceChannel = true;
        currentVoiceChannel = channelName;

        // Добавляем в Firebase
        if (window.FirebaseSync && typeof firebase !== 'undefined') {
            window.FirebaseSync.joinVoiceChannel(channelName, currentUser);

            // Слушаем участников канала
            window.FirebaseSync.getVoiceChannelUsers(channelName, (users) => {
                console.log('🎧 Участники голосового канала:', users);
                updateVoiceParticipantsFromFirebase(users);
            });

            // Heartbeat - обновляем timestamp каждые 30 секунд
            voiceHeartbeatInterval = setInterval(() => {
                if (inVoiceChannel && currentVoiceChannel) {
                    window.FirebaseSync.updateVoiceState(currentVoiceChannel, currentUser, {
                        timestamp: Date.now()
                    });
                    console.log('💓 Heartbeat - обновление timestamp в голосовом канале');
                }
            }, 30000);
        }

        // Визуальное обозначение
        document.querySelectorAll('.channel.voice').forEach(ch => {
            ch.classList.remove('in-voice');
            ch.style.background = '';
            ch.style.borderLeft = '';
        });

        channelElement.classList.add('in-voice');
        channelElement.style.background = 'rgba(102, 126, 234, 0.2)';
        channelElement.style.borderLeft = '3px solid #667eea';

        // Показать компактную панель внизу
        showVoicePanel(channelName);

        // Системное сообщение
        addSystemMessage(`Вы подключились к голосовому каналу "${channelName}"`);

    } catch (error) {
        console.error('Ошибка доступа к микрофону:', error);
        alert('Не удалось получить доступ к микрофону. Проверьте разрешения браузера.');
    }
}

function leaveVoiceChannel() {
    if (!inVoiceChannel) return;

    // Останавливаем heartbeat
    if (voiceHeartbeatInterval) {
        clearInterval(voiceHeartbeatInterval);
        voiceHeartbeatInterval = null;
    }

    // Удаляем из Firebase
    if (window.FirebaseSync && typeof firebase !== 'undefined') {
        if (currentVoiceChannel) {
            window.FirebaseSync.leaveVoiceChannel(currentVoiceChannel, currentUser);
        }
        // Отписываемся от обновлений
        window.FirebaseSync.unsubscribeFromVoiceChannel();
    }

    // Остановка всех потоков
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
    }

    // Закрытие всех соединений
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};

    // Сброс состояния
    const voiceChannels = document.querySelectorAll('.channel.voice');
    voiceChannels.forEach(ch => {
        ch.classList.remove('in-voice');
        ch.style.background = '';
        ch.style.borderLeft = '';
    });

    inVoiceChannel = false;
    micEnabled = true;
    cameraEnabled = false;
    screenEnabled = false;

    hideVoicePanel();
    addSystemMessage('Вы отключились от голосового канала');
    currentVoiceChannel = null;
}

function showVoicePanel(channelName) {
    const panel = document.getElementById('voicePanel');
    document.getElementById('voicePanelChannelName').textContent = channelName;
    document.getElementById('voiceChannelName').textContent = channelName;
    panel.classList.remove('hidden');

    // Добавляем класс для отступа снизу
    document.querySelector('.app').classList.add('voice-active');

    updatePanelControls();
}

function hideVoicePanel() {
    const panel = document.getElementById('voicePanel');
    const modal = document.getElementById('voiceModal');
    panel.classList.add('hidden');
    modal.classList.add('hidden');

    // Убираем класс отступа
    document.querySelector('.app').classList.remove('voice-active');
}

function showVoiceModal() {
    const modal = document.getElementById('voiceModal');
    modal.classList.remove('hidden');
    updateVoiceParticipants();
    updateVoiceControls();
}

function hideVoiceModal() {
    const modal = document.getElementById('voiceModal');
    modal.classList.add('hidden');
}

// Обработчики кнопок панели
document.getElementById('expandVoicePanel').addEventListener('click', showVoiceModal);
document.getElementById('closeVoiceModal').addEventListener('click', hideVoiceModal);
document.getElementById('panelDisconnect').addEventListener('click', leaveVoiceChannel);
document.getElementById('modalDisconnect').addEventListener('click', leaveVoiceChannel);

function updateVoiceParticipants() {
    const container = document.getElementById('voiceParticipants');
    container.innerHTML = '';

    // Добавить себя
    const selfDiv = document.createElement('div');
    selfDiv.className = 'voice-participant';
    selfDiv.innerHTML = `
        <video id="localVideo" autoplay muted playsinline ${cameraEnabled ? '' : 'style="display:none"'}></video>
        <div class="participant-info">
            <img src="${document.getElementById('currentUserAvatar').src}" alt="Avatar">
            <div class="participant-details">
                <span class="participant-name">${currentUser.username} (Вы)</span>
                <div class="participant-status">
                    ${micEnabled ?
            '<svg class="status-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>' :
            '<svg class="status-icon muted" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>'
        }
                    ${cameraEnabled ?
            '<svg class="status-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>' : ''
        }
                    ${screenEnabled ?
            '<svg class="status-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4z"/></svg>' : ''
        }
                </div>
            </div>
        </div>
    `;
    container.appendChild(selfDiv);

    // Подключить локальный поток к видео
    if (cameraEnabled && localStream) {
        const videoElement = document.getElementById('localVideo');
        videoElement.srcObject = localStream;
    }
}

function updateVoiceParticipantsFromFirebase(users) {
    const container = document.getElementById('voiceParticipants');
    container.innerHTML = '';

    users.forEach(user => {
        const isCurrentUser = user.email === currentUser.email;
        const participantDiv = document.createElement('div');
        participantDiv.className = 'voice-participant';
        participantDiv.innerHTML = `
            ${isCurrentUser && cameraEnabled ?
                '<video id="localVideo" autoplay muted playsinline></video>' :
                ''
            }
            <div class="participant-info">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}" alt="Avatar">
                <div class="participant-details">
                    <span class="participant-name">${user.username}${isCurrentUser ? ' (Вы)' : ''}</span>
                    <div class="participant-status">
                        ${user.micEnabled ?
                '<svg class="status-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>' :
                '<svg class="status-icon muted" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>'
            }
                        ${user.cameraEnabled ?
                '<svg class="status-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>' : ''
            }
                    </div>
                </div>
            </div>
        `;
        container.appendChild(participantDiv);
    });

    // Подключить локальный поток к видео
    if (cameraEnabled && localStream) {
        const videoElement = document.getElementById('localVideo');
        if (videoElement) {
            videoElement.srcObject = localStream;
        }
    }
}

// Управление микрофоном
async function toggleMicrophone() {
    if (!localStream) {
        console.error('Нет активного потока');
        return;
    }

    micEnabled = !micEnabled;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = micEnabled;
        console.log('Микрофон:', micEnabled ? 'включен' : 'выключен');
    }

    // Обновляем состояние в Firebase
    if (window.FirebaseSync && typeof firebase !== 'undefined' && currentVoiceChannel) {
        window.FirebaseSync.updateVoiceState(currentVoiceChannel, currentUser, {
            micEnabled: micEnabled
        });
    } else {
        updateVoiceParticipants();
    }

    updateVoiceControls();
    updatePanelControls();
}

document.getElementById('toggleMic').addEventListener('click', toggleMicrophone);
document.getElementById('panelToggleMic').addEventListener('click', toggleMicrophone);

// Управление камерой
async function toggleCameraFunc() {
    if (!localStream) {
        console.error('Нет активного потока');
        return;
    }

    cameraEnabled = !cameraEnabled;
    console.log('Попытка переключить камеру:', cameraEnabled);

    if (cameraEnabled) {
        try {
            // Остановить текущий поток
            const currentAudioEnabled = micEnabled;
            localStream.getTracks().forEach(track => track.stop());

            // Создать новый поток с видео
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            console.log('Камера включена успешно');

            // Восстановить состояние аудио
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = currentAudioEnabled;
            }

        } catch (error) {
            console.error('Ошибка доступа к камере:', error);
            alert('Не удалось получить доступ к камере. Проверьте разрешения браузера.\n\nОшибка: ' + error.message);
            cameraEnabled = false;
        }
    } else {
        // Выключить камеру
        try {
            const currentAudioEnabled = micEnabled;
            localStream.getTracks().forEach(track => track.stop());

            // Создать новый поток только с аудио
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });

            console.log('Камера выключена');

            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = currentAudioEnabled;
            }
        } catch (error) {
            console.error('Ошибка при выключении камеры:', error);
            cameraEnabled = true;
        }
    }

    // Обновляем состояние в Firebase
    if (window.FirebaseSync && typeof firebase !== 'undefined' && currentVoiceChannel) {
        window.FirebaseSync.updateVoiceState(currentVoiceChannel, currentUser, {
            cameraEnabled: cameraEnabled
        });
    } else {
        updateVoiceParticipants();
    }

    updateVoiceControls();
    updatePanelControls();
}

document.getElementById('toggleCamera').addEventListener('click', toggleCameraFunc);
document.getElementById('panelToggleCamera').addEventListener('click', toggleCameraFunc);

// Демонстрация экрана
async function toggleScreenShare() {
    screenEnabled = !screenEnabled;
    console.log('Попытка переключить демонстрацию экрана:', screenEnabled);

    if (screenEnabled) {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    displaySurface: "monitor"
                },
                audio: false
            });

            console.log('Демонстрация экрана включена');

            // Обработка остановки демонстрации через системную кнопку
            screenStream.getVideoTracks()[0].onended = () => {
                console.log('Демонстрация экрана остановлена пользователем');
                screenEnabled = false;
                screenStream = null;

                // Удалить элемент
                const screenDiv = document.getElementById('screenShare');
                if (screenDiv) {
                    screenDiv.remove();
                }

                updateVoiceControls();
                updateVoiceParticipants();
                updatePanelControls();
            };

            // Создать элемент для отображения экрана
            const container = document.getElementById('voiceParticipants');
            let screenDiv = document.getElementById('screenShare');

            if (!screenDiv) {
                screenDiv = document.createElement('div');
                screenDiv.id = 'screenShare';
                screenDiv.className = 'voice-participant screen-share';
                screenDiv.innerHTML = `
                    <video id="screenVideo" autoplay playsinline></video>
                    <div class="screen-label">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4z"/>
                        </svg>
                        Демонстрация экрана - ${currentUser.username}
                    </div>
                `;
                container.insertBefore(screenDiv, container.firstChild);
            }

            const videoElement = document.getElementById('screenVideo');
            videoElement.srcObject = screenStream;

        } catch (error) {
            console.error('Ошибка демонстрации экрана:', error);
            alert('Не удалось начать демонстрацию экрана.\n\nОшибка: ' + error.message);
            screenEnabled = false;
        }
    } else {
        console.log('Остановка демонстрации экрана');
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStream = null;
        }

        const screenDiv = document.getElementById('screenShare');
        if (screenDiv) {
            screenDiv.remove();
        }
    }

    /* Локальное обновление не нужно, если есть Firebase - ждем синхронизации (хотя экран пока не синхронизируется) */
    if (!window.FirebaseSync || typeof firebase === 'undefined') {
        updateVoiceParticipants();
    }

    updateVoiceControls();
    updatePanelControls();
}

document.getElementById('toggleScreen').addEventListener('click', toggleScreenShare);
document.getElementById('panelToggleScreen').addEventListener('click', toggleScreenShare);

function updateVoiceControls() {
    const micBtn = document.getElementById('toggleMic');
    const cameraBtn = document.getElementById('toggleCamera');
    const screenBtn = document.getElementById('toggleScreen');

    // Микрофон
    if (micEnabled) {
        micBtn.classList.remove('disabled');
        micBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            </svg>
        `;
    } else {
        micBtn.classList.add('disabled');
        micBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
            </svg>
        `;
    }

    // Камера
    if (cameraEnabled) {
        cameraBtn.classList.add('active');
    } else {
        cameraBtn.classList.remove('active');
    }

    // Экран
    if (screenEnabled) {
        screenBtn.classList.add('active');
    } else {
        screenBtn.classList.remove('active');
    }
}

function updatePanelControls() {
    const panelMicBtn = document.getElementById('panelToggleMic');
    const panelCameraBtn = document.getElementById('panelToggleCamera');
    const panelScreenBtn = document.getElementById('panelToggleScreen');

    // Микрофон
    if (micEnabled) {
        panelMicBtn.classList.remove('disabled');
        panelMicBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            </svg>
        `;
    } else {
        panelMicBtn.classList.add('disabled');
        panelMicBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
            </svg>
        `;
    }

    // Камера
    if (cameraEnabled) {
        panelCameraBtn.classList.add('active');
    } else {
        panelCameraBtn.classList.remove('active');
    }

    // Экран
    if (screenEnabled) {
        panelScreenBtn.classList.add('active');
    } else {
        panelScreenBtn.classList.remove('active');
    }
}

// ============================================
// УПРАВЛЕНИЕ МИКРОФОНОМ/НАУШНИКАМИ (НИЖНЯЯ ПАНЕЛЬ)
// ============================================

const micBtn = document.getElementById('micBtn');
const headphonesBtn = document.getElementById('headphonesBtn');
const logoutBtn = document.getElementById('logoutBtn');

micBtn.addEventListener('click', () => {
    if (inVoiceChannel) {
        document.getElementById('toggleMic').click();
    }
});

headphonesBtn.addEventListener('click', () => {
    const muted = headphonesBtn.classList.toggle('muted');

    if (muted) {
        headphonesBtn.style.background = '#ed4245';
        headphonesBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4c3.87 0 7 3.13 7 7v2h-2.92L21 17.92V11c0-4.97-4.03-9-9-9-1.95 0-3.76.62-5.23 1.68l1.44 1.44C9.3 4.41 10.6 4 12 4zM2.27 1.72L1 3l3.33 3.32C3.49 7.68 3 9.29 3 11v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-1.17.29-2.26.79-3.22L15 17v4h3c.3 0 .59-.06.86-.14L21 23l1.27-1.27-20-20.01z"/>
            </svg>
        `;
    } else {
        headphonesBtn.style.background = '';
        headphonesBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/>
            </svg>
        `;
    }
});

// Кнопка выхода
logoutBtn.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
        // Отключиться от голосового канала если подключен
        if (inVoiceChannel) {
            leaveVoiceChannel();
        }

        // Очистить данные текущего пользователя
        localStorage.removeItem('currentUser');

        // Перенаправить на страницу авторизации
        window.location.href = 'auth.html';
    }
});

// ============================================
// СИСТЕМНЫЕ СООБЩЕНИЯ
// ============================================

function addSystemMessage(text) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system-message';
    messageDiv.innerHTML = `
        <div class="system-message-content">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>${text}</span>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ СЕРВЕРОВ
// ============================================

document.querySelectorAll('.server-icon').forEach(server => {
    server.addEventListener('click', () => {
        document.querySelectorAll('.server-icon').forEach(srv => srv.classList.remove('active'));
        server.classList.add('active');
    });
});

// ============================================
// АНИМАЦИЯ КАТЕГОРИЙ
// ============================================

document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', () => {
        const svg = header.querySelector('svg');
        const isRotated = svg.style.transform === 'rotate(90deg)';
        svg.style.transform = isRotated ? 'rotate(0deg)' : 'rotate(90deg)';
    });
});

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

displayChannelMessages(currentChannel);
updateMembersList();

// Функция обновления отображения участников голосовых каналов в боковой панели
// Debounce для обновления списка участников (защита от частых перерисовок)
let updateVoiceTimeout;
function updateVoiceChannelParticipants(channels) {
    if (updateVoiceTimeout) clearTimeout(updateVoiceTimeout);

    updateVoiceTimeout = setTimeout(() => {
        // Жесткая очистка всех списков перед новой отрисовкой
        document.querySelectorAll('.voice-users-list').forEach(el => el.remove());
        document.querySelectorAll('.voice-users-count').forEach(el => el.remove());

        document.querySelectorAll('.channel.voice').forEach(voiceChannel => {
            const channelName = voiceChannel.querySelector('span').textContent;
            const encodedName = encodeURIComponent(channelName).replace(/[.#$[\]]/g, '_');
            const users = channels[encodedName] || [];

            if (users.length > 0) {
                // Добавляем счётчик
                const counter = document.createElement('span');
                counter.className = 'voice-users-count';
                counter.textContent = users.length;
                counter.style.cssText = 'margin-left: auto; background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;';
                voiceChannel.appendChild(counter);

                // Добавляем список участников
                const usersList = document.createElement('div');
                usersList.className = 'voice-users-list';
                usersList.setAttribute('data-channel', encodedName);
                usersList.style.cssText = 'padding-left: 30px; margin-top: 5px;';

                // Используем Set для уникальности пользователей по email/username
                const uniqueUsers = new Map();
                users.forEach(user => uniqueUsers.set(user.email, user));

                uniqueUsers.forEach(user => {
                    const userDiv = document.createElement('div');
                    userDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 0.8rem; color: #9ca3af;';
                    userDiv.innerHTML = `
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}" 
                             style="width: 20px; height: 20px; border-radius: 50%;">
                        <span>${user.username}</span>
                        ${!user.micEnabled ? '🔇' : ''}
                    `;
                    usersList.appendChild(userDiv);
                });

                // Вставляем ТОЛЬКО если следующего элемента нет или он не наш список
                const nextEl = voiceChannel.nextElementSibling;
                if (!nextEl || !nextEl.classList.contains('voice-users-list')) {
                    voiceChannel.parentNode.insertBefore(usersList, voiceChannel.nextSibling);
                }
            }
        });
    }, 100); // 100мс задержка
}

// Инициализация Firebase
if (window.FirebaseSync) {
    const firebaseReady = window.FirebaseSync.init();

    if (firebaseReady) {
        console.log('✅ Используем Firebase для синхронизации');

        // Устанавливаем статус онлайн
        currentUser.status = 'online';
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Первое обновление - сразу добавляем пользователя
        window.FirebaseSync.updateUser(currentUser);
        console.log('👤 Пользователь добавлен в Firebase:', currentUser.username);

        // Слушаем изменения пользователей
        window.FirebaseSync.getUsers((users) => {
            console.log('📡 Получены пользователи из Firebase:', users.length);
            displayMembers(users);
        });

        // Подписка на голосовые каналы для отображения участников
        window.FirebaseSync.subscribeToAllVoiceChannels((channels) => {
            console.log('🎙️ Обновление участников голосовых каналов');
            updateVoiceChannelParticipants(channels);
        });

        // Обновляем текущего пользователя каждые 10 секунд
        setInterval(() => {
            if (currentUser) {
                currentUser.status = 'online';
                window.FirebaseSync.updateUser(currentUser);
            }
        }, 10000);

    } else {
        console.log('⚠️ Firebase недоступен, используем localStorage');
        initLocalSync();
    }
} else {
    console.log('⚠️ FirebaseSync не найден, используем localStorage');
    initLocalSync();
}

function initLocalSync() {
    // Инициализация API синхронизации
    if (window.ModernChatAPI) {
        window.ModernChatAPI.initSync();
        window.addEventListener('usersUpdated', updateMembersList);
    }

    // Обновление активности при любом действии
    document.addEventListener('click', () => {
        if (window.ModernChatAPI) {
            window.ModernChatAPI.updateUserActivity();
        }
    });
}

// Обновление списка участников каждые 5 секунд
setInterval(updateMembersList, 5000);

// При закрытии/обновлении страницы выходим из голосового канала
window.addEventListener('beforeunload', () => {
    if (inVoiceChannel && currentVoiceChannel) {
        // Синхронный вызов для выхода из канала
        if (window.FirebaseSync && typeof firebase !== 'undefined') {
            window.FirebaseSync.leaveVoiceChannel(currentVoiceChannel, currentUser);
        }
    }
});

console.log('ModernChat загружен! 🚀');
console.log('Текущий пользователь:', currentUser.username);
console.log('WebRTC поддерживается:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));

