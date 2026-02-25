import { supabase } from './supabase.js';
import { store } from './store.js';
import { showToast } from './components.js';

let subscriptions = {};

export function subscribeToChannel(channelName, callback) {
    const channel = supabase.channel(channelName);
    channel.on('broadcast', { event: 'notification' }, (payload) => {
        callback(payload);
    }).subscribe();
    subscriptions[channelName] = channel;
}

export function notifyPendingApproval(data) {
    if (Notification.permission === 'granted') {
        new Notification('Pending Approval', { body: `Ada ${data.count} pengajuan menunggu.` });
    }
    showToast(`Pending: ${data.count}`, 'warning');
}

// request permission
export function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}
