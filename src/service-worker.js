let token,
    userId    

init()
async function init() {
    if (!Object.values(await chrome.storage.sync.get('magister-gamification'))[0]) return

    console.info("Some enabled features require making HTTP requests. Time to gather HTTP request information.")

    chrome.webRequest.onSendHeaders.addListener(async e => {
        Object.values(e.requestHeaders).forEach(async obj => {
            if (obj.name === 'Authorization' && token !== obj.value) token = obj.value
        })
        if (e.url.split('/personen/')[1]?.split('/')[0].length > 2) userId = e.url.split('/personen/')[1].split('/')[0]

        console.info({ token, userId })
    }, { urls: ['*://*.magister.net/api/m6/personen*instellingen/desktop?filter=VANDAAG_SCHERM*'] }, ['requestHeaders', 'extraHeaders'])
}

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        sendResponse({ token, userId })
    }
);