# PakEdje API Documentation

> **⚠️ DISCLAIMER: This tool is for RESEARCH PURPOSES ONLY. Not intended for commercial use.**

## Core Components

### CarrierDetector

```javascript
/**
 * Detects current carrier from URL
 * @returns {string|null} Carrier identifier or null
 */
function detectCurrentCarrier() {
    // Implementation
}
```

### PackageTracker

```javascript
/**
 * Tracks package status
 * @param {string} trackingCode - Package tracking number
 * @param {string} carrier - Carrier identifier
 * @returns {Promise<Object>} Status object
 */
async function trackPackage(trackingCode, carrier) {
    // Implementation
}
```

### NotificationManager

```javascript
/**
 * Sends notification to all enabled providers
 * @param {string} message - Notification message
 * @param {boolean} mention - Whether to mention user
 * @returns {Promise<void>}
 */
async function sendNotification(message, mention) {
    // Implementation
}
```

## Carrier Implementation

### BaseCarrier

```javascript
class BaseCarrier {
    /**
     * Creates a new carrier instance
     * @param {Object} config - Carrier configuration
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * Detects tracking code from current page
     * @returns {Promise<string|null>} Tracking code or null
     */
    async detectTrackingCode() {
        throw new Error('Not implemented');
    }

    /**
     * Gets current package status
     * @returns {Promise<Object>} Status object
     */
    async getTrackingStatus() {
        throw new Error('Not implemented');
    }
}
```

### Carrier Configuration

```javascript
const CARRIER_CONFIG = {
    postnl: {
        name: 'PostNL',
        domains: ['postnl.nl'],
        trackingPaths: ['/tracking'],
        paramName: 'B',
        validation: /^[A-Z0-9]{10,14}$/
    },
    dpd: {
        name: 'DPD',
        domains: ['dpdgroup.com'],
        trackingPaths: ['/tracking'],
        paramName: 'parcelNumber',
        validation: /^[A-Z0-9]{10,14}$/
    }
    // ... other carriers
};
```

## Notification System

### BaseNotifier

```javascript
class BaseNotifier {
    /**
     * Creates a new notifier instance
     * @param {Object} config - Notifier configuration
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * Sends notification
     * @param {string} message - Notification message
     * @param {boolean} mention - Whether to mention user
     * @returns {Promise<void>}
     */
    async send(message, mention) {
        throw new Error('Not implemented');
    }

    /**
     * Tests notification delivery
     * @returns {Promise<boolean>} Success status
     */
    async test() {
        throw new Error('Not implemented');
    }
}
```

### Notification Configuration

```javascript
const NOTIFICATION_CONFIG = {
    discord: {
        name: 'Discord',
        type: 'webhook',
        required: ['webhookUrl'],
        optional: ['username', 'avatarUrl']
    },
    telegram: {
        name: 'Telegram',
        type: 'bot',
        required: ['botToken', 'chatId'],
        optional: ['parseMode']
    }
    // ... other providers
};
```

## UI Components

### Panel

```javascript
/**
 * Creates main tracking panel
 * @returns {HTMLElement} Panel element
 */
function createPanel() {
    // Implementation
}
```

### Settings

```javascript
/**
 * Creates settings interface
 * @returns {HTMLElement} Settings element
 */
function createSettings() {
    // Implementation
}
```

## State Management

### State Structure

```javascript
const DEFAULT_STATE = {
    version: '1.0.0',
    settings: {
        checkInterval: 60,
        notifications: {
            enabled: true,
            providers: {}
        },
        carriers: {
            enabled: {}
        }
    },
    packages: [],
    history: []
};
```

### State Methods

```javascript
/**
 * Updates application state
 * @param {Object} newState - New state values
 * @returns {Promise<void>}
 */
async function updateState(newState) {
    // Implementation
}

/**
 * Loads saved state
 * @returns {Promise<Object>} Saved state
 */
async function loadState() {
    // Implementation
}
```

## Error Handling

### Error Types

```javascript
const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    NOTIFICATION: 'NOTIFICATION_ERROR',
    CARRIER: 'CARRIER_ERROR'
};
```

### Error Handler

```javascript
/**
 * Handles application errors
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @returns {Promise<void>}
 */
async function handleError(error, context) {
    // Implementation
}
```

## Performance Monitoring

### Metrics

```javascript
const METRICS = {
    checks: 0,
    notifications: 0,
    errors: 0,
    lastCheck: null,
    averageResponse: 0
};
```

### Performance Methods

```javascript
/**
 * Tracks performance metrics
 * @param {string} operation - Operation name
 * @param {number} duration - Operation duration
 * @returns {void}
 */
function trackPerformance(operation, duration) {
    // Implementation
}
```

## Research Notes

This API is designed for research purposes and demonstrates:
- Web automation techniques
- API integration patterns
- Browser extension development
- User interface design
- Notification systems
- Error handling
- Performance monitoring

Please use responsibly and for educational purposes only. 