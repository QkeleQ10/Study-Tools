const defaults = {
    'magister-sw-subjects': `Aardrijkskunde, ak
Bedrijfseconomie, beco
Beeldende vorming, be, bv, kube, kubv
Biologie, bi
Cult. en kunstz. vorming, ckv
Drama, dr, kudr
Duitse taal, dutl, du
Economie, ec
Engelse taal, entl, en
Franse taal, fatl, fa
Geschiedenis, gs
Kunst, ku, kua
Levensbeschouwing, lv
Loopbaan&shy;oriëntatie en &#8209;begeleiding, lob
Maatschappijleer, ma, malv
Maatschappij&shy;wetenschappen, maw
Mentor, mentoruur, mentoraat
Muziek, mu, kumu
Natuurkunde, na
Nederlandse taal, netl, ne
Scheikunde, sk
Wiskunde, wi
Wiskunde A, wa
Wiskunde B, wb
Wiskunde C, wc
Wiskunde D, wd`
}

setSetting('openedPopup', true)

// Bind inputs
document.querySelectorAll('.bind').forEach(async element => {
    let value = await getSetting(element.id)
    switch (element.tagName === 'INPUT' ? element.getAttribute('type') : element.tagName) {
        case 'checkbox':
            element.checked = value
            element.addEventListener('input', event => setSetting(event.target.id, event.target.checked))
            break

        case 'TEXTAREA':
            if (element.classList.contains('bind-array-2d')) {
                if (value) element.value = Object.values(value)[0].map(e => { return e.join(',') }).join('\n')
                else {
                    element.value = defaults[element.id] || undefined
                    setSetting(element.id, { 1: element.value.replace(/ +(?= )/g, '').split('\n').map(e => { return e.split(',') }) })
                }
                element.addEventListener('input', event => setSetting(event.target.id, { 1: event.target.value.replace(/ +(?= )/g, '').split('\n').map(e => { return e.split(',') }) }))
            }
            break

        default:
            if (value) element.value = value
            element.addEventListener('input', event => setSetting(event.target.id, event.target.value))
            break
    }
})

// Allbuttons
document.querySelectorAll('.allbutton').forEach(async element => {
    element.addEventListener('click', event => {
        event.target.disabled = true
        setTimeout(() => { event.target.disabled = false }, 5000)
        switch (event.target.innerText) {
            case 'Alles uit':
                event.target.parentElement.parentElement.querySelectorAll('input[type=checkbox]').forEach(e => { if (e.checked) e.click() })
                event.target.innerText = 'Alles aan'
                break

            default:
                event.target.parentElement.parentElement.querySelectorAll('input[type=checkbox]').forEach(e => { if (!e.checked) e.click() })
                event.target.innerText = 'Alles uit'
                break
        }
    })
})

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