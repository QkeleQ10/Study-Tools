import settings from '../popup/dist/settings.js'

let token,
    userId

const settingsToClear = ['openedPopup', 'updates', 'beta', 'magister-sw-period', 'magister-sw-display', 'magister-subjects', 'magister-appbar-hidePicture', 'magister-appbar-zermelo', 'magister-appbar-zermelo-url', 'magister-css-border-radius', 'magister-css-dark-invert', 'magister-css-experimental', 'magister-css-hue', 'magister-css-luminance', 'magister-css-saturation', 'magister-css-theme', 'magister-op-oldgrey', 'magister-periods', 'magister-shortcut-keys', 'magister-shortcut-keys-master', 'magister-shortcut-keys-today', 'magister-subjects', 'magister-sw-thisWeek', 'magister-vd-subjects', 'version', 'hotkeys-today']

init()

async function init() {
    console.info("Service worker running!")

    setDefaults()

    chrome.webRequest.onSendHeaders.addListener(async e => {
        Object.values(e.requestHeaders).forEach(async obj => {
            if (obj.name === 'Authorization' && token !== obj.value) token = obj.value
        })
        if (e.url.split('/personen/')[1]?.split('/')[0].length > 2) userId = e.url.split('/personen/')[1].split('/')[0]

        chrome.storage.local.set({ 'user-token': token })
        chrome.storage.local.set({ 'user-id': userId })
        console.info("Intercepted user token and user ID.")
    }, { urls: ['*://*.magister.net/api/m6/personen/*/*', '*://*.magister.net/api/personen/*/*', '*://*.magister.net/api/leerlingen/*/*'] }, ['requestHeaders'])

    console.info("Intercepting HTTP request information to extract token and userId...%c\n\nVrees niet, dit is alleen nodig zodat de extensie API-verzoeken kan maken naar Magister. Deze gegevens blijven op je apparaat. Dit wordt momenteel alleen gebruikt voor de volgende onderdelen:\n" + ["cijferexport"].join(', ') + "\n\nen in de toekomst eventueel ook voor:\n" + ["rooster op startpagina", "puntensysteem"].join(', '), "font-size: .8em")
}

async function setDefaults() {
    let syncedStorage = await chrome.storage.sync.get()
    let diff = {}

    // Check each setting to see if its value has been defined. If not, set it to the default value.
    settings.forEach(category => {
        category.settings.forEach(setting => {
            if (typeof syncedStorage[setting.id] === 'undefined') {
                diff[setting.id] = setting.default
            }
        })
    })

    if (Object.keys(diff).length > 0) {
        setTimeout(() => chrome.storage.sync.set(diff), 200)
        console.info("Set the following storage.sync keys to their default values:", diff)
    }

    if (settingsToClear.some(key => Object.keys(syncedStorage).includes(key))) {
        chrome.storage.sync.remove(settingsToClear)
        console.info("Redundant storage.sync keys removed to free up space.")
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getCredentials':
            sendResponse({ token, userId })
            console.info("Sent user token, user ID and sign-on ID to content script.")
            return true

        case 'waitForRequestCompleted':
            chrome.webRequest.onCompleted.addListener((details) => {
                sendResponse({ status: 'completed', details: details })
            }, { urls: ['*://*.magister.net/api/personen/*/aanmeldingen/*/cijfers/extracijferkolominfo/*'] })
            setTimeout(() => {
                sendResponse({ status: 'timeout' })
            }, 5000)
            return true

        default:
            break;
    }
})