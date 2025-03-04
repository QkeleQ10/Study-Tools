import settings from '../popup/dist/settings.js'

let userId,
    userToken,
    userTokenDate

const settingsToClear = [
    'auto-theme', 'theme-fixed', 'theme-day', 'theme-night', 'openedPopup', 'updates', 'beta', 'magister-shortcuts', 'magister-shortcuts-today', 'magister-sw-grid', 'magister-sw-sort', 'magister-sw-period', 'magister-sw-display', 'magister-ag-large', 'magister-subjects', 'magister-appbar-hidePicture', 'appbar-hide-actions', 'magister-appbar-zermelo', 'magister-appbar-zermelo-url', 'magister-css-border-radius', 'magister-css-dark-invert', 'magister-css-experimental', 'magister-css-hue', 'magister-css-luminance', 'magister-css-saturation', 'magister-css-theme', 'magister-op-oldgrey', 'magister-periods', 'periods', 'magister-shortcut-keys', 'magister-shortcut-keys-master', 'magister-shortcut-keys-today', 'magister-subjects', 'magister-sw-thisWeek', 'magister-vd-overhaul', 'magister-vd-enabled', 'magister-vd-subjects', 'magister-vd-grade', 'magister-vd-agendaHeight', 'magister-vd-deblue', 'magister-vd-gradewidget', 'magisterLogin-password', 'magisterLogin-method', 'magister-gamification-beta', 'gamification-enabled', 'magister-cf-calculator', 'magister-cf-statistics', 'magister-cf-backup', 'magister-cf-failred', 'notes-enabled', 'notes', 'st-notes', 'vd-enabled', 'vd-schedule-days', 'vd-schedule-extra-day', 'vd-schedule-zoom', 'vd-subjects-display', 'start-stats', 'teacher-names', 'version', 'disable-css', 'hotkeys-today', 'start-widgets', 'dark-image', 'light-image', 'subjects', 'hidden-studyguides', 'color', 'start-schedule-days', 'v', 'special'
]

startListenCredentials()
setDefaults()
console.info("Service worker running!")
addEventListener('activate', () => {
    startListenCredentials()
    setDefaults()
    console.info("Service worker running!")
})

chrome.runtime.onStartup.addListener(() => {
    startListenCredentials()
    setDefaults()
    console.info("Browser started, service worker revived.")
})

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3)
chrome.runtime.onStartup.addListener(keepAlive)
keepAlive()

async function startListenCredentials() {
    // Allow any context to use chrome.storage.session
    chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' })

    // Initialise the three variables
    userId = (await chrome.storage.sync.get('user-id'))?.['user-id'] || null
    userToken = (await chrome.storage.session.get('token'))?.['token'] || null
    userTokenDate = (await chrome.storage.session.get('token-date'))?.['token-date'] || new Date(0)

    chrome.webRequest.onBeforeSendHeaders.addListener(async e => {
        // Return if the request was made by Study Tools itself
        if (Object.values(e.requestHeaders).find(header => header.name === 'X-Request-Source')?.value === 'study-tools') return

        console.info('Request caught!')

        let userIdWas = userId
        let userTokenWas = userToken
        let userTokenDateWas = userTokenDate

        let urlUserId = e.url.split('/personen/')[1]?.split('/')[0]
        if (urlUserId?.length > 2 && !urlUserId.includes('undefined')) {
            userId = urlUserId || userIdWas
            chrome.storage.sync.set({ 'user-id': userId })
            if (userIdWas !== userId) console.info(`User ID changed from ${userIdWas} to ${userId}.`)
        }

        let authObject = Object.values(e.requestHeaders).find(header => header.name === 'Authorization')
        if (authObject) {
            userToken = authObject.value
            userTokenDate = new Date()
            chrome.storage.session.set({ 'token': userToken })
            chrome.storage.session.set({ 'token-date': userTokenDate.getTime() })
            if (userTokenWas !== userToken && new Date(userTokenDateWas).getTime() == 0) console.info(`User token gathered. Length: ${userToken.length}.`)
            else if (userTokenWas !== userToken) console.info(`User token changed since ${userTokenDate - userTokenDateWas} ms ago.`)
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
                if (setting.id === 'wallpaper' && syncedStorage['backdrop']?.length > 5) diff[setting.id] = 'custom,' + syncedStorage['backdrop']
                else diff[setting.id] = setting.default
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
            console.info("Popstate detected, service worker revived.")
            return 0

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

        case 'uninstallSelf':
            chrome.management.uninstallSelf({ showConfirmDialog: false }, () => { window.location.reload() })
            break

        case 'openOptions':
            chrome.tabs.create({ url: `popup/dist/index.html?${request.data}` });
            break;

        default:
            return 0
    }
})

chrome.runtime.onMessageExternal.addListener(async (request, sender, sendResponse) => {
    switch (request.action) {
        case 'addPersonalTheme':
            const obj = request.obj
            const storedThemes = Object.values((await chrome.storage.local.get('storedThemes')).storedThemes)
            if (!storedThemes || storedThemes.length >= 9) return

            storedThemes.push(obj)

            //TODO: only if not exist

            await chrome.storage.local.set({ 'storedThemes': storedThemes })
            break

        default:
            return 0
    }
})
