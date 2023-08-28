let token,
    userId,
    signOnId

init()
async function init() {
    console.info("Service worker running!")

    // SHOULD CHECK AND SET DEFAULT SETTINGS. POTENTIAL ISSUE= import '' from ''

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