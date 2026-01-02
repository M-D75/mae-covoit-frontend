import axios from 'axios';

const getOnlineBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'http:') {
        return "http://server-mae-covoit-notif.infinityinsights.fr";
    }
    return "https://server-mae-covoit-notif.infinityinsights.fr";
};

const BASE_URLS = {
    local: "http://localhost:3001",
    online: getOnlineBaseUrl(),
};

/**
 * Send a push notification to a mobile user through the backend.
 * Falls back silently if the user has no registered device.
 */
export async function sendServerNotification({ mode = 'online', userId, title, body, data = {}, delaySeconds = 2 }) {
    if (!userId) {
        return;
    }

    const targetMode = mode && BASE_URLS[mode] ? mode : 'online';
    const url = BASE_URLS[targetMode];

    const scheduledDate = new Date();
    if (delaySeconds && delaySeconds !== 0) {
        scheduledDate.setSeconds(scheduledDate.getSeconds() + delaySeconds);
    }

    try {
        await axios.post(`${url}/reservation`, {
            userId,
            date: scheduledDate,
            title,
            body,
            data,
        });
    }
    catch(error){
        console.error("sendServerNotification error:", error);
    }
}
