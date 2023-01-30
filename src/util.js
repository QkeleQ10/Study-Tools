checkSettings()
checkUpdates()

async function checkSettings() {
    if (await getSetting('openedPopup')) return
    showNotification("Functies inschakelen", `Alle functies van Study Tools zijn standaard uitgeschakeld. <b>Schakel ze in bij 'Study Tools' onder het menu 'Extensies'.</b><br><br>Dit bericht verdwijnt na het eenmalig openen van de extensie permanent.`)
}

async function checkUpdates(override) {
    let beta = await getSetting('beta')
    if (override) beta = false
    if (!await getSetting('updates')) return
    fetch(`https://raw.githubusercontent.com/QkeleQ10/Study-Tools/${beta ? 'dev' : 'main'}/manifest.json`)
        .then((response) => response.json())
        .then(async data => {
            if (data.version > chrome.runtime.getManifest().version) showNotification(`Nieuwe ${beta ? 'bèta' : ''}versie (${data.version})`, `Er is een nieuwere versie van Study Tools beschikbaar. <a href="https://QkeleQ10.github.io/extensions/studytools/update">Klik hier om deze te installeren.</a>`)
        })
        .catch(error => {
            if (!override) checkUpdates(true)
        })
}

function getElement(querySelector, all, immediate) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            if (document.querySelector(querySelector)) {
                clearInterval(interval)
                clearTimeout(timeout)
                return resolve(all ? document.querySelectorAll(querySelector) : document.querySelector(querySelector))
            }
        }, 50)

        let timeout = setTimeout(() => {
            clearInterval(interval)
            console.error("Could not find element: ", querySelector)
            return resolve(undefined)
        }, 10000)
    })
}

function getSetting(key, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}

function getSettings(array, location, all) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].get(all ? null : array.map(e => [e]), (result) => {
            result ? resolve(result) : reject(Error('None found'))
        })
    })
}

function setSetting(key, value, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].set({ [key]: value }, resolve())
    })
}

function setSettings(object, location) {
    return new Promise((resolve, reject) => {
        chrome.storage[location ? location : 'sync'].set(object, resolve())
    })
}

function showNotification(title, body, timeout) {
    let notification = document.createElement('div')
    notification.innerHTML =
        `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap');#stnotifh,#stnotifh2,#stnotifp{font-family:'montserrat',system-ui,sans-serif;user-select:none;color:#fff}#stnotifh, #stnotifh2{margin:.5em 0;font-size:24px;font-weight:700}#stnotifh:after{content:'.';color:#ff8205}#stnotifh2{font-size:18px}#stnotifp{font-size:12px}#stnotifp>a{color:#fff}</style>
        <h1 id="stnotifh">Study Tools</h1>
        <h1 id="stnotifh2">${title}</h1>
        <p id="stnotifp">${body}</p>`
    notification.setAttribute('style',
        `width:276px;position:fixed;top:0;right:${document.body.clientWidth > 500 ? '20em' : '0'};padding:.5em 1em 2em;background-color:#1f97f9;color:#fff;font-family:system-ui,sans-serif;user-select:none;outline:#808080 solid 1px;box-shadow:0 0 1em #000;z-index:9999`)
    document.body.prepend(notification)

    if (timeout) setTimeout(() => notification.remove(), timeout)
}

function createStyle(content, id) {
    return new Promise((resolve, reject) => {
        let styleElem = document.createElement('style')
        if (id) styleElem.id = id
        styleElem.innerHTML = content
        document.head.append(styleElem)
        resolve(styleElem)
    })
}