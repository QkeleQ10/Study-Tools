login()

async function login() {
    if (!syncedStorage['magisterLogin-enabled']) return

    const username = syncedStorage['magisterLogin-username']

    const footer = document.querySelector('.bottom')
    footer.style.translate = '0 -2rem'
    footer.innerText = "Automatisch inloggen is ingeschakeld. Je kunt de instellingen aanpassen via de pop-up van Study Tools."

    const forceLogoutTimestamp = await getFromStorage('force-logout', 'local')
    if (forceLogoutTimestamp && Math.abs(new Date().getTime() - forceLogoutTimestamp) <= 30000) {
        footer.innerText = "Automatisch inloggen is tijdelijk gepauzeerd. De volgende keer zal er weer automatisch worden ingelogd."
        return
    }

    const usernameInput = await awaitElement('#username')
    usernameInput.value = username
    usernameInput.dispatchEvent(new Event('input'))

    const usernameSubmit = await awaitElement('#username_submit')
    usernameSubmit.click()
}