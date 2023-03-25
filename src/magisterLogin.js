login()

async function login() {
    if (await getSetting('magisterLogin-method') === 'off') return

    const forceLogoutTimestamp = await getSetting('force-logout', 'local'),
        footer = document.querySelector('.bottom')

    footer.style.translate = '0 -2rem'
    if (forceLogoutTimestamp && Math.abs(new Date().getTime() - forceLogoutTimestamp) <= 30000)
        return footer.innerText = "Automatisch inloggen is tijdelijk gepauzeerd. De volgende keer zal er weer automatisch worden ingelogd."

    footer.innerText = "Automatisch inloggen is ingeschakeld. Je kunt de instellingen aanpassen via de extensie van Study Tools."

    let usernameField = await getElement('#username'),
        username = await getSetting('magisterLogin-username')
    usernameField.value = username
    usernameField.dispatchEvent(new Event('input'))

    let usernameSubmit = await getElement('#username_submit')
    usernameSubmit.click()

    let password = await getSetting('magisterLogin-password'),
        passwordField = await getElement('#rswp_password')
    passwordField.value = password
    passwordField.dispatchEvent(new Event('input'))

    let passwordSubmit = await getElement('#rswp_submit')
    passwordSubmit.click()
}