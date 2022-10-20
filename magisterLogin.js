login()

async function login() {
    try {
        await getSetting('magisterLogin-enabled')

        document.querySelector('.bottom').innerHTML = "<p><b>Automatisch inloggen is ingeschakeld.</b> Je kunt de instellingen aanpassen via de extensie van Study Tools.</p>"

        let usernameField = await element('#username'),
            username = await getSetting('magisterLogin-username')
        usernameField.value = username
        usernameField.dispatchEvent(new Event('input'))

        let usernameSubmit = await element('#username_submit')
        usernameSubmit.click()

        let password = await getSetting('magisterLogin-password'),
            passwordField = await element('#rswp_password')
        passwordField.value = password
        passwordField.dispatchEvent(new Event('input'))

        let passwordSubmit = await element('#rswp_submit')
        passwordSubmit.click()
    } catch (error) {
        throw error
    }
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
        chrome.storage.local.get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}