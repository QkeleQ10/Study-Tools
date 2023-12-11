import settings from '../popup/dist/settings.js'

let apiUserId,
    apiUserToken,
    apiUserTokenDate

const settingsToClear = [
    'openedPopup', 'updates', 'beta', 'magister-sw-period', 'magister-sw-display', 'magister-subjects', 'magister-appbar-hidePicture', 'magister-appbar-zermelo', 'magister-appbar-zermelo-url', 'magister-css-border-radius', 'magister-css-dark-invert', 'magister-css-experimental', 'magister-css-hue', 'magister-css-luminance', 'magister-css-saturation', 'magister-css-theme', 'magister-op-oldgrey', 'magister-periods', 'periods', 'magister-shortcut-keys', 'magister-shortcut-keys-master', 'magister-shortcut-keys-today', 'magister-subjects', 'magister-sw-thisWeek', 'magister-vd-overhaul', 'magister-vd-enabled', 'magister-vd-subjects', 'magister-vd-grade', 'magister-vd-agendaHeight', 'magisterLogin-password', 'magisterLogin-method', 'magister-gamification-beta', 'notes-enabled', 'notes', 'st-notes', 'vd-enabled', 'vd-subjects-display', 'version', 'hotkeys-today'
]

startListenCredentials()
setDefaults()
console.info("Service worker running!")

async function startListenCredentials() {
    // Allow any context to use chrome.storage.session
    chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })

    // Initialise the three variables
    apiUserId = (await chrome.storage.session.get('user-id'))?.['user-id'] || null
    apiUserToken = (await chrome.storage.session.get('token'))?.['token'] || null
    apiUserTokenDate = (await chrome.storage.session.get('token-date'))?.['token-date'] || null

    chrome.webRequest.onBeforeSendHeaders.addListener(async e => {
        let userIdWas = apiUserId
        let userTokenWas = apiUserToken
        if (e.url.split('/personen/')[1]?.split('/')[0].length > 2) {
            apiUserId = e.url.split('/personen/')[1].split('/')[0]
            chrome.storage.session.set({ 'user-id': apiUserId })
            if (userIdWas !== apiUserId) console.info(`User ID changed from ${userIdWas} to ${apiUserId}.`)
        }
        let authObject = Object.values(e.requestHeaders).find(obj => obj.name === 'Authorization')
        if (authObject) {
            apiUserToken = authObject.value
            apiUserTokenDate = new Date()
            chrome.storage.session.set({ 'token': apiUserToken })
            chrome.storage.session.set({ 'token-date': apiUserTokenDate.getTime() })
            if (userTokenWas !== apiUserToken) console.info(`User token changed between ${new Date().toLocaleDateString()} and now.`)
        }

    }, { urls: ['*://*.magister.net/*'] }, ['requestHeaders'])

    console.info("Intercepting HTTP request information to extract token and userId...%c\n\nVrees niet, dit is alleen nodig zodat de extensie API-verzoeken kan maken naar Magister. Deze gegevens blijven op je apparaat. Dit wordt momenteel alleen gebruikt voor de volgende onderdelen:\n" + ["cijferexport", "widgets startpagina", "rooster startpagina", "puntensysteem"].join(', ') + "\n\nen in de toekomst eventueel ook voor:\n" + [].join(', '), "font-size: .8em")
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
        case 'popstateDetected':
            console.info("Popstate detected, service worker revived for 30 seconds.")
            break

        case 'waitForRequestCompleted':
            console.info(`Request completion notification requested by ${sender.url}.`)
            chrome.webRequest.onCompleted.addListener((details) => {
                sendResponse({ status: 'completed', details: details })
                console.info(`Request completion notification sent to ${sender.url}.`)
            }, { urls: ['*://*.magister.net/api/personen/*/aanmeldingen/*/cijfers/extracijferkolominfo/*'] })
            setTimeout(() => {
                sendResponse({ status: 'timeout' })
                console.warn(`Request completion notification requested by ${sender.url} has timed out.`)
            }, 5000)
            return true

        default:
            break
    }
})

async function sleepUntil(f, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timeWas = new Date()
        const wait = setInterval(function () {
            if (f()) {
                clearInterval(wait)
                resolve()
            } else if (new Date() - timeWas > timeoutMs) {
                clearInterval(wait)
                reject()
            }
        }, 20)
    })
}
