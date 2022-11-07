
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function getPeriodNumber(w) {
    if (w >= 30 && w < 48)
        return 1

    if (w >= 48 || w < 4)
        return 2

    if (w >= 4 && w < 14)
        return 3

    return 0
}

// CHANGE THE UPDATE POPUP
async function checkUpdates() {
    if (!await getSetting('updates')) return
    fetch("https://raw.githubusercontent.com/QkeleQ10/Study-Tools/main/manifest.json")
        .then((response) => response.json())
        .then(async data => {
            if (data.version <= chrome.runtime.getManifest().version) return
            notify(`Er is een nieuwere versie van Study Tools beschikbaar. <a href="https://QkeleQ10.github.io/extensions/studytools/update">Klik hier om deze te installeren.</a>`)
        })
}

async function checkSettings() {
    if (await getSetting('openedPopup')) return
    notify(`Alle functies van Study Tools zijn standaard uitgeschakeld. <b>Schakel ze in bij 'Study Tools' onder het menu 'Extensies'.</b><br><br>Dit bericht verdwijnt na het eenmalig openen van de extensie permanent.`)
}

function element(querySelector) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            if (document.querySelector(querySelector)) {
                clearInterval(interval)
                clearTimeout(timeout)
                return resolve(document.querySelector(querySelector))
            }
        }, 50)

        let timeout = setTimeout(() => {
            clearInterval(interval)
            return reject(Error(`Element "${querySelector}" not found`))
        }, 4000)
    })
}

function getSetting(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}

function notify(body, timeout) {
    let notification = document.createElement('div')
    notification.innerHTML =
        `<style>#stnotifh,#stnotifp{font-family:system-ui,sans-serif;user-select:none;color:#fff}#stnotifh{margin:.5em 0;font-size:24px;font-weight:700}#stnotifh:after{content:'.';color:#ff8205}#stnotifp{font-size:12px}#stnotifp>a{color:#fff}</style>
        <h1 id="stnotifh">Study Tools</h1>
        <p id="stnotifp">${body}</p>`
    notification.setAttribute('style',
        `width:276px;position:fixed;top:0;right:20em;padding:.5em 1em 2em;background-color:#1f97f9;color:#fff;font-family:system-ui,sans-serif;user-select:none;outline:#808080 solid 1px;box-shadow:0 0 1em #000;z-index:9999`)
    document.body.prepend(notification)

    if (timeout) setTimeout(() => notification.remove(), timeout)
}