// ==UserScript==
// @name         PakEdje - Multi-Carrier Package Tracker
// @namespace    http://tampermonkey.net/
// @version      1.2.5
// @description  Advanced multi-carrier package tracking system for Netherlands/Belgium. For RESEARCH PURPOSES ONLY. Not for commercial use.
// @author       Ferry Well
// @match        *://*.dpdgroup.com/*
// @match        *://*.postnl.nl/*
// @match        *://*.ups.com/*
// @match        *://*.dhl.com/*
// @match        *://*.gls-group.eu/*
// @match        *://*.bpost.be/*
// @match        *://*.mondialrelay.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @updateURL    https://raw.githubusercontent.com/Ferrywell/PakEdje/main/pakedje.user.js
// @downloadURL  https://raw.githubusercontent.com/Ferrywell/PakEdje/main/pakedje.user.js
// ==/UserScript==

/*
    ⚠️ DISCLAIMER: This tool is for RESEARCH PURPOSES ONLY. Not intended for commercial use.

    This file is the main entry point for the PakEdje Tampermonkey script.
    All your JavaScript code from src/core, src/carriers, src/notifications, src/ui, etc.,
    should be combined or included here to form a single executable script for Tampermonkey.
    For simplicity in Tampermonkey, all the relevant JavaScript code will eventually reside in this file.
*/

(function() {
    'use strict';

    const CARRIER_CONFIG = {
        dpd: {
            name: 'DPD',
            domains: ['dpd.com', 'dpdgroup.com', 'e.dpd.nl'],
            trackingPaths: ['/nl/nl/ontvangen/volgen/', '/nl/en/receiving/track/', '/trace.dpd.fr/en/trace', '/nl/mydpd/my-parcels/incoming', '/link'],
            paramName: 'parcelNumber',
            regex: /[?&]parcelNumber=([A-Z0-9]{10,20})/i // Regex for DPD tracking numbers in query string
        },
        postnl: {
            name: 'PostNL',
            domains: ['postnl.nl'],
            trackingPaths: ['/track-and-trace/'],
            paramName: null, // Voor PostNL zit het nummer vaak direct in het pad
            regex: /(?:track-and-trace|mijn-pakket)\/([A-Z0-9]{10,20}(?:-[A-Z0-9]+)*)/i // Regex voor PostNL tracking nummers
        },
        ups: {
            name: 'UPS',
            domains: ['ups.com'],
            trackingPaths: ['/track', '/track?'],
            paramName: 'tracknum', // Placeholder
            regex: /(?:\/tracknum=|\/track\/TrackingNumber=)?([A-Z0-9]{10,35})/i // Regex voor UPS tracking nummers
        },
        dhl: {
            name: 'DHL',
            domains: ['dhl.com', 'dhlparcel.nl'],
            trackingPaths: ['/tracking', '/track'],
            paramName: 'trackingNumber', // Placeholder
            regex: /(?:\/trackingNumber=|\/track\/|\/track\/)?([A-Z0-9]{10,35})/i // Regex voor DHL tracking nummers
        },
        gls: {
            name: 'GLS',
            domains: ['gls-group.eu', 'gls-parcelshop.nl'],
            trackingPaths: ['/track/'],
            paramName: 'matchcode', // Placeholder
            regex: /(?:matchcode=)?([A-Z0-9]{10,20})/i // Regex voor GLS tracking nummers
        },
        bpost: {
            name: 'Bpost',
            domains: ['bpost.be', 'track.bpost.be'],
            trackingPaths: ['/bpc/track_search'],
            paramName: 'SearchId', // Placeholder
            regex: /(?:SearchId=)?([A-Z0-9]{10,20})/i // Regex voor Bpost tracking nummers
        },
        mondialrelay: {
            name: 'Mondial Relay',
            domains: ['mondialrelay.com'],
            trackingPaths: ['/suivi-de-colis'],
            paramName: 'numTracking', // Placeholder
            regex: /(?:numTracking=)?([A-Z0-9]{10,20})/i // Regex voor Mondial Relay tracking nummers
        }
    };

    /**
     * Detecteert de huidige vervoerder en het trackingnummer op basis van de URL.
     * @returns {{carrier: string|null, trackingNumber: string|null}} Een object met de gedetecteerde vervoerder en trackingnummer.
     */
    function detectCarrierAndTrackingNumber() {
        const url = window.location.href;
        let detectedCarrier = null;
        let detectedTrackingNumber = null;

        for (const carrierKey in CARRIER_CONFIG) {
            const config = CARRIER_CONFIG[carrierKey];

            // Controleer op domein
            const domainMatched = config.domains.some(domain => url.includes(domain));
            if (!domainMatched) {
                continue;
            }

            // Controleer op tracking pad
            const pathMatched = config.trackingPaths.some(path => url.includes(path));
            if (!pathMatched) {
                continue;
            }

            // Probeer trackingnummer te extraheren met regex
            const match = url.match(config.regex);
            if (match && match[1]) {
                detectedCarrier = carrierKey;
                detectedTrackingNumber = match[1];
                break;
            }
        }

        console.log(`Detected Carrier: ${detectedCarrier}, Tracking Number: ${detectedTrackingNumber}`);
        return { carrier: detectedCarrier, trackingNumber: detectedTrackingNumber };
    }

    class PackageTracker {
        constructor(carrierConfig) {
            this.carrierConfig = carrierConfig;
        }

        /**
         * Haalt de trackingstatus op voor een specifiek pakket.
         * @param {string} carrierKey - De sleutel van de vervoerder (e.g., 'postnl', 'dpd').
         * @param {string} trackingNumber - Het trackingnummer van het pakket.
         * @returns {Promise<Object>} Een Promise die resolved met een statusobject { status: string, details: string, location: string }.
         */
        async getTrackingStatus(carrierKey, trackingNumber) {
            const config = this.carrierConfig[carrierKey];
            if (!config) {
                console.error(`Onbekende vervoerder: ${carrierKey}`);
                return { status: 'Error', details: 'Onbekende vervoerder', location: null };
            }

            let trackingUrl = '';
            let requestOptions = {};

            switch (carrierKey) {
                case 'postnl':
                    trackingUrl = `https://jouw.postnl.nl/track-and-trace/api/trackAndTrace/${trackingNumber}?language=nl`;
                    requestOptions = { method: 'GET' };
                    break;
                case 'dpd':
                    // If on a DPD myDPD tracking page, parse DOM directly
                    if (window.location.pathname.includes('/nl/mydpd/my-parcels/incoming')) {
                        const parsedStatus = parseDPDStatus(document.documentElement.innerHTML);
                        return { status: parsedStatus.status, details: parsedStatus.details, location: null, events: parsedStatus.events };
                    } else {
                        trackingUrl = `https://www.dpd.com/nl/nl/ontvangen/volgen/?parcelnumber=${trackingNumber}`;
                        requestOptions = { method: 'GET' };
                    }
                    break;
                case 'ups':
                    trackingUrl = `https://www.ups.com/track?tracknum=${trackingNumber}`;
                    requestOptions = { method: 'GET' };
                    break;
                case 'dhl':
                    trackingUrl = `https://www.dhl.com/nl-en/home/tracking.html?trackingNumber=${trackingNumber}`;
                    requestOptions = { method: 'GET' };
                    break;
                case 'gls':
                    trackingUrl = `https://gls-group.eu/NL/nl/pakket-zoeken.html?matchcode=${trackingNumber}`;
                    requestOptions = { method: 'GET' };
                    break;
                case 'bpost':
                    trackingUrl = `https://track.bpost.be/bpc/track_search?SearchId=${trackingNumber}`;
                    requestOptions = { method: 'GET' };
                    break;
                case 'mondialrelay':
                    trackingUrl = `https://www.mondialrelay.fr/suivi-de-colis?numTracking=${trackingNumber}`;
                    requestOptions = { method: 'GET' };
                    break;
                default:
                    console.warn(`Geen specifieke trackinglogica voor ${carrierKey}.`);
                    return { status: 'Onbekend', details: 'Geen trackinglogica', location: null };
            }

            console.log(`Pakketstatus opvragen voor ${carrierKey} met nummer ${trackingNumber} via URL: ${trackingUrl}`);

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: requestOptions.method,
                    url: trackingUrl,
                    onload: function(response) {
                        // Hier komt de parsing logica voor de specifieke vervoerder
                        // Voor nu een placeholder
                        console.log(`Response van ${carrierKey}:`, response.responseText.substring(0, 200) + '...'); // Log de eerste 200 tekens

                        // Voorbeeld parsing (dit moet per vervoerder gespecificeerd worden)
                        let status = 'Onbekende status';
                        let details = 'Details nog niet geparseerd.';
                        let location = null;
                        let events = [];

                        if (carrierKey === 'postnl') {
                            const parsedStatus = parsePostNLStatus(response.responseText);
                            status = parsedStatus.status;
                            details = parsedStatus.details;
                            location = parsedStatus.location;
                            events = parsedStatus.events;
                        }
                        if (carrierKey === 'dpd') {
                            const parsedStatus = parseDPDStatus(response.responseText);
                            status = parsedStatus.status;
                            details = parsedStatus.details;
                            events = parsedStatus.events;
                        }
                        // ... overige carrier specifieke parsing hier

                        resolve({ status, details, location, events });
                    },
                    onerror: function(error) {
                        console.error(`Fout bij opvragen status voor ${carrierKey}:`, error);
                        reject({ status: 'Error', details: 'Fout bij netwerkverzoek', location: null });
                    }
                });
            });
        }
    }

    function parsePostNLStatus(response) {
        try {
            const data = JSON.parse(response);
            const trackingNumber = Object.keys(data.colli)[0];
            const packageData = data.colli[trackingNumber];

            if (!packageData) {
                return { status: "Onbekende status (geen pakketdata)", details: "Geen pakketdata gevonden in de respons.", events: [], raw: data };
            }

            let status = "Onbekende status";
            let details = "Details niet beschikbaar.";
            let events = [];
            let deliveryInfo = "";
            let etaInfo = "";

            console.log("PostNL: packageData.observations:", packageData.observations);
            console.log("PostNL: packageData.observations.length:", packageData.observations ? packageData.observations.length : 0);

            // Main status
            if (packageData.statusPhase && packageData.statusPhase.message) {
                status = packageData.statusPhase.message;
            }

            // Delivery status and date
            if (packageData.isDelivered) {
                status = "Bezorgd";
                if (packageData.deliveryDate) {
                    const date = new Date(packageData.deliveryDate);
                    deliveryInfo = ` (${date.toLocaleDateString('nl-NL')} om ${date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })})`;
                }
            }

            // ETA information
            if (packageData.eta && packageData.eta.start && packageData.eta.end) {
                const etaStart = new Date(packageData.eta.start);
                const etaEnd = new Date(packageData.eta.end);
                etaInfo = ` Verwachte bezorging: ${etaStart.toLocaleDateString('nl-NL')} tussen ${etaStart.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} en ${etaEnd.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
            }

            // Observations/Events
            if (packageData.observations && packageData.observations.length > 0) {
                details = `Laatste update: ${packageData.observations[0].description}.`;
                events = packageData.observations.map(obs => {
                    const date = new Date(obs.observationDate);
                    return `${date.toLocaleDateString('nl-NL')} ${date.toLocaleTimeString('nl-NL')}: ${obs.description}`;
                });
            } else if (packageData.statusPhase && packageData.statusPhase.message) {
                details = packageData.statusPhase.message; // Fallback if no detailed observations
            }

            return { status: status + deliveryInfo, details: details + etaInfo, events: events, raw: data };
        } catch (e) {
            console.error("Error parsing PostNL JSON response:", e);
            return { status: "Onbekende status (parseerfout)", details: "Fout bij het parsen van de JSON respons.", events: [], raw: null };
        }
    }

    function parseDPDStatus(response) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');
            const statusRows = doc.querySelectorAll('.parcelStatus .row');
            let events = [];
            let mainStatus = 'Onbekende status';
            let details = '';

            // Extract timeline events
            statusRows.forEach(row => {
                const statusEl = row.querySelector('.col-xs-7 > span');
                const dateEl = row.querySelector('.col-xs-5 > span.bolded.inlineDate');
                const statusText = statusEl ? statusEl.textContent.trim() : '';
                const dateText = dateEl ? dateEl.textContent.trim() : '';
                if (statusText) {
                    events.push(dateText ? `${dateText}: ${statusText}` : statusText);
                }
            });

            // The most recent status with a date is the current status
            for (let i = 0; i < events.length; i++) {
                if (events[i].match(/^\d{2}-\d{2}-\d{4}/)) {
                    mainStatus = events[i];
                    break;
                }
            }
            if (mainStatus === 'Onbekende status' && events.length > 0) {
                mainStatus = events[0];
            }
            details = events.length > 0 ? `Tijdlijn: ${events.join(' | ')}` : 'Geen tijdlijn gevonden.';

            return { status: mainStatus, details, events };
        } catch (e) {
            console.error('Error parsing DPD HTML response:', e);
            return { status: 'Onbekende status (parseerfout)', details: 'Fout bij het parsen van de HTML respons.', events: [] };
        }
    }

    function parseDPDSummaryList(doc) {
        const parcels = [];
        const list = doc.querySelectorAll('.parcel-list > li');
        list.forEach(li => {
            const link = li.querySelector('a[href*="parcelNumber="]');
            if (!link) return;
            const trackingNumberMatch = link.href.match(/parcelNumber=([0-9]+)/);
            const trackingNumber = trackingNumberMatch ? trackingNumberMatch[1] : null;
            const aliasEl = link.querySelector('.parcelAlias');
            const alias = aliasEl ? aliasEl.textContent.trim() : null;
            const statusEl = link.querySelector('.gray-out > span');
            const status = statusEl ? statusEl.textContent.trim() : null;
            if (trackingNumber && status) {
                parcels.push({ trackingNumber, status, alias });
            }
        });
        return parcels;
    }

    function parseDPDParcelDetails(doc) {
        const details = {};
        // Tracking number
        const trackingEl = doc.querySelector('.parcelNumber');
        details.trackingNumber = trackingEl ? trackingEl.textContent.trim() : null;
        // Status
        const statusEl = doc.querySelector('.deliveryStatusType');
        details.status = statusEl ? statusEl.textContent.trim() : null;
        // Sender
        const senderEl = doc.querySelector('.parcelSender h4 span');
        details.sender = senderEl ? senderEl.textContent.trim() : null;
        // Recipient
        const recipientEl = doc.querySelector('.box-4 p:nth-of-type(2)');
        details.recipient = recipientEl ? recipientEl.textContent.trim() : null;
        // Address (combine all address lines)
        const addressLines = Array.from(doc.querySelectorAll('.box-4 p'))
            .slice(2) // skip 'Naar:' and recipient
            .map(p => p.textContent.trim())
            .filter(line => line.length > 0);
        details.address = addressLines.join(', ');
        // Weight
        const weightEl = doc.querySelector('.box-5 .mb-15:nth-of-type(1) p:nth-of-type(2)');
        details.weight = weightEl ? weightEl.textContent.trim() : null;
        // Dimensions
        const dimEl = doc.querySelector('.box-5 .mb-15:nth-of-type(2) p:nth-of-type(2)');
        details.dimensions = dimEl ? dimEl.textContent.trim() : null;
        // Product
        const productEl = doc.querySelector('.box-5 .mb-15:nth-of-type(3) p:nth-of-type(2)');
        details.product = productEl ? productEl.textContent.trim() : null;
        return details;
    }

    // Initialiseer de detectie zodra het DOM geladen is
    function initPakEdje() {
        console.log('Initializing PakEdje...');
        const { carrier, trackingNumber } = detectCarrierAndTrackingNumber();

        if (carrier && trackingNumber) {
            console.log(`Verzender: ${carrier}, Trackingnummer: ${trackingNumber}`);
            const packageTracker = new PackageTracker(CARRIER_CONFIG);
            packageTracker.getTrackingStatus(carrier, trackingNumber)
                .then(result => {
                    console.log(`Pakketstatus voor ${carrier}:`);
                    console.log(`  Status: ${result.status}`);
                    console.log(`  Details: ${result.details}`);
                    if (result.events && result.events.length > 0) {
                        console.log(`  Tijdlijn:`);
                        result.events.forEach(event => console.log(`    - ${event}`));
                    }
                    // Hier zou de UI-update of notificatielogica komen
                })
                .catch(error => {
                    console.error('Fout bij het ophalen van de pakketstatus:', error);
                });
        } else {
            console.log('Geen trackinginformatie gevonden op deze pagina. PakEdje blijft inactief.');
        }

        if (carrier === 'dpd' && window.location.hostname === 'e.dpd.nl' && document.querySelector('.parcel-list')) {
            const doc = document;
            const parcels = parseDPDSummaryList(doc);
            console.log('DPD summary list detected. Parcels:');
            parcels.forEach(parcel => {
                console.log(`  Tracking: ${parcel.trackingNumber}, Status: ${parcel.status}${parcel.alias ? ', Alias: ' + parcel.alias : ''}`);
            });
            // Detailed summary for the active parcel
            const details = parseDPDParcelDetails(doc);
            if (details.trackingNumber) {
                console.log('\nDPD active parcel summary:');
                Object.entries(details).forEach(([key, value]) => {
                    if (value) console.log(`  ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
                });
            }
            return;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPakEdje);
    } else {
        initPakEdje();
    }

})(); 