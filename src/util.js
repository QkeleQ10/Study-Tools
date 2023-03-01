window.addEventListener('DOMContentLoaded', (event) => {
    const snackbarWrapper = document.createElement('div')
    snackbarWrapper.id = 'st-snackbars'
    document.body.append(snackbarWrapper)
    createStyle(`
#st-snackbars {
    position: absolute; bottom: 32px; left: 32px; width: 400px; display: flex; flex-direction: column-reverse; gap: 16px; pointer-events: none;
}

#st-snackbars>div {
    min-height: 40px; translate: 0 150%; opacity: 0; background-color: #111; color: #fff; padding: 14px 20px; border-radius: 8px; font-size: 16px; border: 1px solid #222; box-shadow: 0 0 5px 0 rgba(0,0,0,0.75); z-index: 9999999; transition: translate 200ms, opacity 200ms;
}

#st-snackbars>div.open {
    translate: 0; opacity: 1;
}
    `, 'st-snackbar')

    checkSettings()
    checkUpdates()
})

async function checkSettings() {
    if (!await getSetting('openedPopup'))
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

function getElement(querySelector, all, duration) {
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
            console.warn("Could not find element: ", querySelector, all, duration)
            return resolve(undefined)
        }, duration || 10000)
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
    const notification = document.createElement('div'),
        notificationStyle = document.createElement('style'),
        notificationH = document.createElement('h1'),
        notificationH2 = document.createElement('h1'),
        notificationP = document.createElement('p'),
        notificationA = document.createElement('a')
    notification.append(notificationStyle, notificationH, notificationH2, notificationP)
    notificationStyle.textContent = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap');#stnotifh,#stnotifh2,#stnotifp{font-family:'montserrat',system-ui,sans-serif;user-select:none;color:#fff}#stnotifh, #stnotifh2{margin:.5em 0;font-size:24px;font-weight:700}#stnotifh:after{content:'.';color:#ff8205}#stnotifh2{font-size:18px}#stnotifp{font-size:12px}#stnotifp>a{color:#fff!important;text-decoration:underline!important}`
    notificationH.innerText = "Study Tools"
    notificationH.id = 'stnotifh'
    notificationH2.innerText = title
    notificationH2.id = 'stnotifh2'
    notificationP.innerHTML = body
    notificationP.id = 'stnotifp'
    notification.setAttribute('style',
        `width:276px;position:fixed;top:0;right:${document.body.clientWidth > 500 ? '20em' : '0'};padding:.5em 1em 2em;background-color:#1f97f9;color:#fff;font-family:system-ui,sans-serif;user-select:none;outline:#808080 solid 1px;box-shadow:0 0 1em #000;z-index:9999`)
    document.body.prepend(notification)

    if (timeout) setTimeout(() => notification.remove(), timeout)
}

async function showSnackbar(body, duration = 4000) {
    const snackbar = document.createElement('div'),
        snackbarWrapper = await getElement('#st-snackbars')
    snackbarWrapper.append(snackbar)
    snackbar.innerText = body
    setTimeout(() => {
        snackbar.classList.add('open')
    }, 50)
    setTimeout(() => {
        snackbar.classList.remove('open')
    }, duration)
    setTimeout(() => {
        snackbar.remove()
    }, duration + 150)
}

function createStyle(content, id = 'st-style') {
    return new Promise((resolve, reject) => {
        let styleElem = document.querySelector(`style#${id}`) || document.createElement('style')
        styleElem.id = id
        styleElem.textContent = content
        document.head.append(styleElem)
        resolve(styleElem)
    })
}