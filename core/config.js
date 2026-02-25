export const CONFIG = {
    supabase: {
        url: 'https://pvznaeppaagylwddirla.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo'
    },
    appName: 'Dream OS v2.0',
    version: '2.0.0',
    sessionTimeout: 300, // detik
    lockoutAttempts: 3,
    lockoutDuration: 300,
    ai: {
        enablePrediction: true,
        enableChatbot: true,
        modelPath: '/models/'
    },
    offline: {
        enable: true,
        syncInterval: 60000 // 1 menit
    },
    notifications: {
        enableRealtime: true,
        channels: ['approval', 'stock', 'maintenance']
    }
};
