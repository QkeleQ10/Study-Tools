let token,
    userId

init()
async function init() {
    if (!Object.values(await chrome.storage.sync.get('magister-gamification-beta'))[0]) return

    console.info("Some enabled features require making HTTP requests. Intercepting HTTP request information...")

    chrome.webRequest.onSendHeaders.addListener(async e => {
        Object.values(e.requestHeaders).forEach(async obj => {
            if (obj.name === 'Authorization' && token !== obj.value) token = obj.value
        })
        if (e.url.split('/personen/')[1]?.split('/')[0].length > 2) userId = e.url.split('/personen/')[1].split('/')[0]

        chrome.storage.local.set({ 'user-token': token })
        chrome.storage.local.set({ 'user-id': userId })
        console.info("Intercepted user token and user ID.")
    }, { urls: ['*://*.magister.net/api/m6/personen/*/*', '*://*.magister.net/api/personen/*/*', '*://*.magister.net/api/leerlingen/*/*'] }, ['requestHeaders', 'extraHeaders'])
}

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        sendResponse({ token, userId })
        console.info("Sent user token and user ID to content script.")
    }
)