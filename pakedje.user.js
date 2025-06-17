// ==UserScript==
// @name         PakEdje - Multi-Carrier Package Tracker
// @namespace    http://tampermonkey.net/
// @version      1.1.0
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
            domains: ['dpd.com', 'dpdgroup.com'],
            trackingPaths: ['/nl/nl/ontvangen/volgen/', '/nl/en/receiving/track/', '/trace.dpd.fr/en/trace'],
            paramName: 'parcelNumber', // Dit is een placeholder, echte parameters moeten geëxtraheerd worden uit de URL
            regex: /(?:\/parcelNumber=|\/tracking\/|\/track\/)?([A-Z0-9]{10,20})/i // Voorbeeld regex voor DPD tracking nummers
        },
        postnl: {
            name: 'PostNL',
            domains: ['postnl.nl'],
            trackingPaths: ['/track-and-trace/'],
            paramName: null, // Voor PostNL zit het nummer vaak direct in het pad
            regex: /(?:track-and-trace|mijn-pakket)\/([A-Z0-9]{10,20}(?:NL)?)(?:-[A-Z0-9]+)?/i // Regex voor PostNL tracking nummers
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

    // Initialiseer de detectie zodra het DOM geladen is
    function initPakEdje() {
        console.log('Initializing PakEdje...');
        const { carrier, trackingNumber } = detectCarrierAndTrackingNumber();
        if (carrier && trackingNumber) {
            console.log(`Verzender: ${carrier}, Trackingnummer: ${trackingNumber}`);
            // Hier zou verdere logica komen voor het tonen van de UI, status ophalen, etc.
        } else {
            console.log('Geen trackinginformatie gevonden op deze pagina. PakEdje blijft inactief.');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPakEdje);
    } else {
        initPakEdje();
    }

})(); 