chrome.webRequest.onBeforeRequest.addListener(async req => {
    if (req.url.split('/api/leerlingen/')[1].includes('/') || req.url.split('/api/leerlingen/')[1].includes('?')) return
    let school = req.url.split('://')[1].split('.magister.net/api')[0],
        student = btoa(req.url.split('/api/leerlingen/')[1]),
        id = btoa(school + student),
        time = new Date().valueOf(),
        version = chrome.runtime.getManifest().version,
        config = {
            cssEnhanced: await getSetting('magister-css-experimental'),
            cssTheme: await getSetting('magister-css-theme'),
            cssAccent: `hsl(${await getSetting('magister-css-hue')}deg, ${await getSetting('magister-css-luminance')}%, ${await getSetting('magister-css-saturation')}%)`,
            login: await getSetting('magisterLogin-method'),
            todayOverhaul: await getSetting('magister-vd-overhaul'),
            studyguide: await getSetting('magister-sw-display'),
            gradeCalculator: await getSetting('magister-cf-calculator'),
            gradeStatistics: await getSetting('magister-cf-statistics'),
            gradeBackup: await getSetting('magister-cf-backup'),
            loginNoordhoff: await getSetting('noordhoff-login-enabled')
        },
        browser = userAgent()
    console.log({ [id]: { school, student, time, version, config, browser } })
}, { urls: ['*://*.magister.net/api/leerlingen/*'] })

function userAgent() {
    let strings = []
    if (navigator?.userAgentData?.brands?.some(data => data.brand == 'Chromium')) strings.push('chromium')
    if (navigator?.userAgentData?.brands?.some(data => data.brand == 'Google Chrome')) strings.push('chrome')
    if (navigator?.userAgentData?.brands?.some(data => data.brand == 'Microsoft Edge')) strings.push('edge')
    if (navigator?.userAgentData?.brands?.some(data => data.brand == 'Brave')) strings.push('brave')
    if (navigator?.userAgentData?.brands?.some(data => data.brand == 'Opera')) strings.push('opera')
    if (navigator?.userAgent?.indexOf('Firefox') > -1) strings.push('firefox')

    if (strings.length < 1) strings.push('unknown')

    return strings.join('/')
}

function getSetting(key, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}