let settings = {}

window.addEventListener('DOMContentLoaded', async () => {
    if (chrome?.storage) settings = await getSettings(null, null, true)

    const snackbarWrapper = document.createElement('div')
    snackbarWrapper.id = 'st-snackbars'
    document.body.append(snackbarWrapper)
    createStyle(`
#st-snackbars {
    position: absolute; bottom: 0; left: 0; padding: 0 32px; width: 464px; display: flex; flex-direction: column-reverse; opacity: 0; background: linear-gradient(18deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%); transition: background 500ms, opacity 500ms, padding 500ms;
}
#st-snackbars:has(div.open) {
    padding: 32px; 
    opacity: 1;
    background: radial-gradient(at bottom left, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 70%);
    z-index: 99999999;
}
#st-snackbars>div {
    display: flex; justify-content: space-between; gap: 6px; min-height: 40px; max-height: 220px; translate: 0 150%; opacity: 0; line-height: 16px; background-color: #111; color: #fff; padding: 14px 20px; margin-top: 16px; border-radius: 8px; font: 16px 'Segoe UI', system-ui; border: 1px solid #222; box-shadow: 0 0 8px 0 rgba(0,0,0,1); transition: translate 200ms, opacity 200ms, max-height 200ms, min-height 200ms, padding 200ms, margin 200ms, line-height 200ms;
}
#st-snackbars>div.open {
    translate: 0; opacity: 1;
}
#st-snackbars>div:not(.open) {
    max-height: 0;
    min-height: 0;
    padding-block: 0;
    margin-block: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transition: translate 500ms cubic-bezier(.75, 0, 1, 1), opacity 500ms cubic-bezier(.75, 0, 1, 1), max-height 500ms cubic-bezier(.75, 0, 1, 1), min-height 500ms cubic-bezier(.75, 0, 1, 1), padding 500ms cubic-bezier(.75, 0, 1, 1), margin 500ms cubic-bezier(.75, 0, 1, 1), line-height 500ms cubic-bezier(.75, 0, 1, 1);
}
#st-snackbars>div>a {
    min-width: fit-content; text-transform: uppercase; font-weight: bold; cursor: pointer;
}
    `, 'st-snackbar')

    checkUpdates()
    checkDefaults()

    setTimeout(() => {
        setSetting('usedExtension', chrome.runtime.getManifest().version, 'local')
    }, 500)
})

async function checkUpdates(override) {
    let beta = settings['beta']
    if (override) beta = false
    if (!settings['updates']) return
    fetch(`https://raw.githubusercontent.com/QkeleQ10/Study-Tools/${beta ? 'dev' : 'main'}/manifest.json`)
        .then(async response => {
            if (response.ok) {
                let data = await response.json()
                if (data.version > chrome.runtime.getManifest().version) {
                    showSnackbar(`Nieuwe ${beta ? 'bèta' : ''}versie van Study Tools (${data.version}) beschikbaar.`, 121000, [{ innerText: "installeren", href: 'https://qkeleq10.github.io/extensions/studytools/update', target: 'blank' }])
                }
            } else console.warn("Error requesting Study Tools manifest", response)
        })
        .catch(() => {
            if (!override) checkUpdates(true)
        })

    if (settings['update-notes']) {
        fetch(`https://raw.githubusercontent.com/QkeleQ10/Study-Tools/${beta ? 'dev' : 'main'}/updates.json`)
            .then(async response => {
                if (response.ok) {
                    let data = await response.json()
                    for (const key in data) {
                        if (Object.hasOwnProperty.call(data, key) && key > await getSetting('usedExtension', 'local')) {
                            showSnackbar(`Nieuw in ${key}:\n${data[key]}`, 10000)
                        }
                    }
                } else console.warn("Error requesting Study Tools updates", response)
            })
    }
}

async function checkDefaults() {
    settingsBuilder.forEach(section => {
        section.settings.forEach(setting => {
            if (typeof settings[setting.id] === 'undefined' && setting.default) { setSetting(setting.id, setting.default) }
        })
    })
    let colorSettings = ['magister-css-hue', 'magister-css-saturation', 'magister-css-luminance'], colorDefaults = [207, 95, 55]
    colorSettings.forEach((setting, index) => {
        if (typeof settings[setting] === 'undefined') {
            setSetting(setting, colorDefaults[index])
        }
    })

    if (!await getSetting('usedExtension', 'local'))
        showSnackbar("Vernieuw de pagina zodat Study Tools in werking kan treden.", 121000, [{ innerText: "vernieuwen", onclick: 'window.location.reload()' }])
}

function setIntervalImmediately(func, interval) {
    func()
    return setInterval(func, interval)
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

function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key])
    }
}

async function showSnackbar(body = 'Snackbar', duration = 4000, buttons = []) {
    const snackbar = document.createElement('div'),
        snackbarWrapper = await getElement('#st-snackbars')
    snackbarWrapper.append(snackbar)
    snackbar.innerText = body
    snackbar.addEventListener('dblclick', () => {
        snackbar.classList.remove('open')
        setTimeout(() => snackbar.remove(), 200)
    })
    buttons.forEach(element => {
        let a = document.createElement('a')
        snackbar.append(a)
        setAttributes(a, element)
        if (element.innerText) a.innerText = element.innerText
        a.addEventListener('click', event => event.stopPropagation())
    })
    setTimeout(() => snackbar.classList.add('open'), 50)
    setTimeout(() => snackbar.classList.remove('open'), duration)
    setTimeout(() => snackbar.remove(), duration + 2000)
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