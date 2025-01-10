login();

async function login() {
    chrome.runtime.sendMessage({ action: 'popstateDetected' });

    const footerNotice = element('div', 'bottom-st', null, {
        innerHTML: "\xa0|\xa0Autom. inloggen <span style='color: var(--st-foreground-accent);'>aan</span>",
        title: "Meer informatie over automatisch inloggen",
        style: "cursor: pointer;",
    });
    document.querySelector('footer>.bottom-company-logo, footer>*:last-child')?.before(footerNotice);

    let autoLoginDisclaimer = "Study Tools is actief en er wordt een poging gedaan om automatisch in te loggen. \n\nControleer je instellingen als het inloggen niet slaagt."
    footerNotice.addEventListener('click', () => notify('dialog', autoLoginDisclaimer, [{
        innerText: "Instellingen",
        primary: true,
        onclick: () => chrome.runtime.sendMessage({ action: 'openOptions', data: 'tab=login' }),
    }]));

    if (!syncedStorage['magisterLogin-enabled'] || !syncedStorage['magisterLogin-username']) {
        footerNotice.innerHTML = "\xa0|\xa0Autom. inloggen <span style='color: var(--st-accent-warn);'>uit</span>";
        autoLoginDisclaimer = "Study Tools is actief, maar automatisch inloggen is nog niet ingesteld. \n\nGebruik onderstaande knop om de instellingen te openen.";
        return;
    }

    const forceLogoutTimestamp = await getFromStorage('force-logout', 'local')
    if (forceLogoutTimestamp && Math.abs(new Date().getTime() - forceLogoutTimestamp) <= 30000) {
        footerNotice.innerHTML = "\xa0|\xa0Autom. inloggen <span style='color: var(--st-accent-warn);'>uit</span>";
        autoLoginDisclaimer = "Study Tools is actief, maar automatisch inloggen is tijdelijk gepauzeerd omdat je handmatig hebt uitgelogd. \n\nDe volgende keer zal er weer automatisch worden ingelogd.";
        return;
    }

    const usernameInput = await awaitElement('#username');
    usernameInput.value = syncedStorage['magisterLogin-username'];
    usernameInput.dispatchEvent(new Event('input'));

    const usernameSubmit = await awaitElement('#username_submit');
    usernameSubmit.click();
}