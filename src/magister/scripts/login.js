login()

async function login() {
    if (!syncedStorage['magisterLogin-enabked']) return

    const forceLogoutTimestamp = await getFromStorage('force-logout', 'local'),
        footer = document.querySelector('.bottom')

    footer.style.translate = '0 -2rem'
    if (forceLogoutTimestamp && Math.abs(new Date().getTime() - forceLogoutTimestamp) <= 30000)
        return footer.innerText = "Automatisch inloggen is tijdelijk gepauzeerd. De volgende keer zal er weer automatisch worden ingelogd."

    footer.innerText = "Automatisch inloggen is ingeschakeld. Je kunt de instellingen aanpassen via de extensie van Study Tools."

    let usernameField = await awaitElement('#username'),
        username = syncedStorage['magisterLogin-username']
    usernameField.value = username
    usernameField.dispatchEvent(new Event('input'))

    let usernameSubmit = await awaitElement('#username_submit')
    usernameSubmit.click()

    let passwordField = await awaitElement('#rswp_password')
    if (passwordField) notify('snackbar', "Om privacyredenen ondersteunt Study Tools niet langer het inloggen met een wachtwoord. Vul je wachtwoord zelf in.")
}