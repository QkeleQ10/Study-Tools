import settings from '../popup/dist/settings.js'

let apiUserId,
    apiUserToken,
    apiUserTokenDate

const settingsToClear = [
    'openedPopup', 'updates', 'beta', 'magister-sw-period', 'magister-sw-display', 'magister-subjects', 'magister-appbar-hidePicture', 'magister-appbar-zermelo', 'magister-appbar-zermelo-url', 'magister-css-border-radius', 'magister-css-dark-invert', 'magister-css-experimental', 'magister-css-hue', 'magister-css-luminance', 'magister-css-saturation', 'magister-css-theme', 'magister-op-oldgrey', 'magister-periods', 'periods', 'magister-shortcut-keys', 'magister-shortcut-keys-master', 'magister-shortcut-keys-today', 'magister-subjects', 'magister-sw-thisWeek', 'magister-vd-enabled', 'magister-vd-subjects', 'magister-vd-grade', 'magister-vd-agendaHeight', 'magister-gamification-beta', 'vd-subjects-display', 'version', 'hotkeys-today'
]

init()

async function init() {
    apiUserId = (await chrome.storage.local.get('user-id'))?.['user-id'] || undefined
    apiUserToken = (await chrome.storage.local.get('token'))?.['token'] || undefined
    apiUserTokenDate = (await chrome.storage.local.get('token-date'))?.['token-date'] || undefined

    console.info("Service worker running!")

    setDefaults()

    chrome.webRequest.onBeforeSendHeaders.addListener(async e => {
        let userIdWas = apiUserId
        let userTokenWas = apiUserToken
        if (e.url.split('/personen/')[1]?.split('/')[0].length > 2) {
            apiUserId = e.url.split('/personen/')[1].split('/')[0]
            chrome.storage.local.set({ 'user-id': apiUserId })
            if (userIdWas !== apiUserId) console.info(`User ID changed from ${userIdWas} to ${apiUserId}.`)
        }
        Object.values(e.requestHeaders).forEach(async obj => {
            if (obj.name === 'Authorization') {
                apiUserToken = obj.value
                apiUserTokenDate = new Date()
                chrome.storage.local.set({ 'token': apiUserToken })
                chrome.storage.local.set({ 'token-date': apiUserTokenDate })
                if (userTokenWas !== apiUserToken) console.info(`User token changed between ${new Date().toLocaleDateString()} and now.`)
            }
        })

    }, { urls: ['*://*.magister.net/api/m6/personen/*/*', '*://*.magister.net/api/personen/*/*', '*://*.magister.net/api/leerlingen/*/*'] }, ['requestHeaders', 'extraHeaders'])

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
        case 'getCredentials':
            console.info(`Credentials requested by ${sender.url}.`)
            // TODO: this sucks
            sleepUntil(() => { return (new Date() - apiUserTokenDate) < 180000 }, 1000)
                .then(() => {
                    sendResponse({ apiUserId, apiUserToken })
                    console.info(`Credentials sent to ${sender.url}.`)
                })
                .catch(() => {
                    sendResponse({ status: 'error' })
                })
            return true

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
            break;
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
