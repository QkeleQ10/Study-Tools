window.addEventListener('DOMContentLoaded', async () => {
    const snackbarWrapper = document.createElement('div')
    snackbarWrapper.id = 'st-snackbars'
    document.body.append(snackbarWrapper)
    createStyle(`
#st-snackbars {
    position: absolute; bottom: 0; left: 0; width: 464px; display: flex; flex-direction: column-reverse; gap: 16px; background: linear-gradient(18deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%); transition: background 200ms, opacity 200ms;
}
#st-snackbars:has(div.open) {
    padding: 32px; 
    opacity: 1;
    background: radial-gradient(at bottom left, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 70%);
    z-index: 99999999;
}
#st-snackbars>div {
    display: flex; justify-content: space-between; gap: 6px; min-height: 40px; translate: 0 150%; opacity: 0; background-color: #111; color: #fff; padding: 14px 20px; border-radius: 8px; font: 16px 'Segoe UI', system-ui; border: 1px solid #222; box-shadow: 0 0 8px 0 rgba(0,0,0,1); transition: translate 200ms, opacity 200ms;
}
#st-snackbars>div.open {
    translate: 0; opacity: 1;
}
#st-snackbars>div>a {
    min-width: fit-content; text-transform: uppercase; font-weight: bold; cursor: pointer;
}
    `, 'st-snackbar')

    if (!await getSetting('openedPopup'))
        showSnackbar("Study Tools zal momenteel niet correct werken. Schakel eerst de gewenste opties in bij 'Study Tools' in het menu Extensies.")

    checkUpdates()
})

async function checkUpdates(override) {
    let beta = await getSetting('beta')
    if (override) beta = false
    if (!await getSetting('updates')) return
    fetch(`https://raw.githubusercontent.com/QkeleQ10/Study-Tools/${beta ? 'dev' : 'main'}/manifest.json`)
        .then(async response => {
            if (response.ok) {
                let data = await response.json()
                if (data.version > chrome.runtime.getManifest().version) {
                    showSnackbar(`Nieuwe ${beta ? 'bèta' : ''}versie van Study Tools (${data.version}) beschikbaar.`, 120000, [{ innerText: "installeren", href: 'https://qkeleq10.github.io/extensions/studytools/update', target: 'blank' }])
                }
            } else console.warn("Error requesting Study Tools manifest", response)
        })
        .catch(error => {
            if (!override) checkUpdates(true)
        })

    if (await getSetting("update-notes")) {
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

    setTimeout(() =>
        setSetting('usedExtension', chrome.runtime.getManifest().version, 'local'), 4000)
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

async function showSnackbar(body, duration = 4000, buttons = []) {
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
    setTimeout(() => snackbar.remove(), duration + 200)
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