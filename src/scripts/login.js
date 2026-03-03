login();

async function login() {
    chrome.runtime.sendMessage({ action: 'popstateDetected' });

    const footerNew = (await awaitElement('.app-container')).createChildElement('footer', {
        style: 'position: absolute; bottom: 0; left: 0; translate: 0 !important; width: 100%;'
    });
    footerNew.createChildElement('a', {
        innerText: "Study Tools",
        style: 'font-weight: bold; cursor: pointer;',
        href: ''
    })
    const footerNotice = footerNew.createChildElement('a', {
        innerText: "Automatisch inloggen ingeschakeld",
        title: "Meer informatie over automatisch inloggen",
        style: 'cursor: pointer;',
        href: ''
    })

    let autoLoginDisclaimer = "Study Tools is actief en er wordt een poging gedaan om automatisch in te loggen. \n\nControleer je instellingen als het inloggen niet slaagt."
    footerNew.addEventListener('click', () => notify('dialog', autoLoginDisclaimer, [{
        innerText: "Instellingen",
        primary: true,
        onclick: () => chrome.runtime.sendMessage({ action: 'openOptions', data: 'tab=login' }),
    }]));

    if (!syncedStorage['magisterLogin-enabled'] || !syncedStorage['magisterLogin-username']) {
        footerNotice.innerText = "Automatisch inloggen uitgeschakeld";
        autoLoginDisclaimer = "Study Tools is actief, maar automatisch inloggen is nog niet ingesteld. \n\nGebruik onderstaande knop om de instellingen te openen.";
        return;
    }

    const forceLogoutTimestamp = await getFromStorage('force-logout', 'local')
    if (forceLogoutTimestamp && Math.abs(new Date().getTime() - forceLogoutTimestamp) <= 30000) {
        footerNotice.innerText = "Automatisch inloggen gepauzeerd";
        autoLoginDisclaimer = "Study Tools is actief, maar automatisch inloggen is tijdelijk gepauzeerd omdat je handmatig hebt uitgelogd. \n\nDe volgende keer zal er weer automatisch worden ingelogd.";
        return;
    }

    const usernameInput = await awaitElement('#username');
    usernameInput.value = syncedStorage['magisterLogin-username'];
    usernameInput.dispatchEvent(new Event('input'));

    const usernameSubmit = await awaitElement('#username_submit');
    usernameSubmit.click();
}