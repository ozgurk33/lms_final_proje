// Simple event emitter for React Native (no Node.js dependencies)
class SimpleEventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event, listenerToRemove) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(
            listener => listener !== listenerToRemove
        );
    }

    emit(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }
}

export const authEvents = new SimpleEventEmitter();

// Event types
export const AUTH_EVENTS = {
    LOGIN: 'login',
    LOGOUT: 'logout',
};
