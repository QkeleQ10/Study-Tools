const settingsBuilder = [
    {
        id: "section-magister-color",
        group: "Magister",
        title: "Thema",
        settings: [
            {
                id: "magister-css-experimental",
                title: "Verbeteringen aan uiterlijk",
                subtitle: "Veel functies van Study Tools werken mogelijk niet goed als dit is uitgeschakeld.",
                default: true,
            },
            {
                id: "magister-css-theme",
                title: "Kleurenthema",
                type: "select",
                wizard: "Kies in welk kleurenthema Magister moet worden weergegeven.",
                require: "magister-css-experimental",
                default: "auto",
                options: [
                    {
                        value: "auto",
                        title: "Aanpassen aan systeemthema"
                    },
                    {
                        value: "light",
                        title: "Licht thema"
                    },
                    {
                        value: "dark",
                        title: "Donker thema"
                    },
                ]
            },
            {
                id: "color-picker",
                title: "Accentkleur",
                version: "2.3.4",
                type: "color-picker",
                wizard: "Wil je een alternatieve accentkleur kiezen?",
                require: "magister-css-experimental",
            },
            {
                id: "magister-css-border-radius",
                title: "Afgeronde hoeken",
                type: "slider",
                default: 8,
                defaultFormatted: "8px",
                suffix: "px",
                min: 0,
                max: 20,
                step: 1,
                require: "magister-css-experimental",
            },
            {
                id: "magister-css-dark-invert",
                title: "Inhoud donker maken",
                subtitle: "[Experimenteel] Studiewijzers en opdrachten donker maken indien het donkere thema actief is.",
                default: true,
                require: "magister-css-experimental",
            },
        ]
    },
    {
        id: "section-magister-login",
        group: "Magister",
        title: "Inloggen",
        wizard: "Kies de manier van inloggen op je school om automatisch inloggen in te schakelen.",
        settings: [
            {
                id: "magisterLogin-method",
                title: "Automatisch inloggen",
                type: "select",
                default: "microsoft",
                options: [
                    {
                        value: "microsoft",
                        title: "Met een Microsoft-account"
                    },
                    {
                        value: "password",
                        title: "Met een Magister-wachtwoord",
                    },
                    {
                        value: "off",
                        title: "Uit",
                    },
                ]
            },
            {
                id: "magisterLogin-username",
                title: "Gebruikersnaam",
                type: "text",
                require: "magisterLogin-method!==off",
            },
            {
                id: "magisterLogin-email",
                title: "E-mailadres",
                subtitle: "Van het Microsoft-account dat moet worden gekozen.",
                type: "text",
                fieldType: "email",
                require: "magisterLogin-method===microsoft",
            },
            {
                id: "magisterLogin-password",
                title: "Wachtwoord",
                type: "text",
                fieldType: "password",
                require: "magisterLogin-method===password",
            },
        ]
    },
    {
        id: "section-magister-overlay",
        group: "Magister",
        title: "Overlay",
        settings: [
            {
                id: 'magister-overlay-hotkey',
                title: "Activatietoets",
                subtitle: "De toets waarmee de overlay opgeroepen kan worden.",
                type: "key",
                default: "S",
                require: "magister-css-experimental",
            },
            {
                id: 'magister-shortcuts',
                title: "Sneltoetsen",
                subtitle: "Houd de activatietoets ingedrukt en druk op een getal op je toetsenbord voor snelle navigatie.",
                default: true,
                require: "magister-overlay-hotkey? magister-css-experimental",
            },
            {
                id: 'magister-shortcuts-today',
                title: "Snellere sneltoetsen",
                subtitle: "Op de pagina 'Vandaag' zijn sneltoetsen bruikbaar zonder dat je de activatietoets ingedrukt hoeft te houden.",
                default: true,
                require: "magister-overlay-hotkey? magister-shortcuts magister-css-experimental",
            },
            {
                id: 'magister-notes-beta2',
                title: "Notities",
                subtitle: "Houd de activatietoets ingedrukt om notities weer te geven. Druk op '0' op je toetsenbord om vast te zetten.",
                default: false,
                class: 'beta',
                require: "beta-options magister-overlay-hotkey? magister-css-experimental",
            }
        ]
    },
    {
        id: "section-magister-sidebar",
        group: "Magister",
        title: "Menubalk",
        settings: [
            {
                id: "magister-appbar-week",
                title: "Weeknummer tonen",
                default: true,
            },
            {
                id: "magister-appbar-zermelo",
                title: "Link naar Zermelo tonen",
            },
            {
                id: "magister-appbar-zermelo-url",
                title: "Webadres Zermelo",
                subtitle: "Bijvoorbeeld 'school.zportal.nl/app'. Dit hoeft alleen ingevuld te worden als er problemen optreden.",
                type: "text",
                require: "magister-appbar-zermelo",
            },
            {
                id: 'magister-picture',
                title: "Profielfoto",
                type: 'select',
                default: 'hide',
                options: [
                    {
                        value: "show",
                        title: "Originele profielfoto"
                    },
                    {
                        value: "custom",
                        title: "Aangepaste profielfoto"
                    },
                    {
                        value: "hide",
                        title: "Geen profielfoto"
                    },
                ],
            },
            {
                id: 'magister-picture-source',
                title: "Aangepaste profielfoto",
                type: 'image-picker',
                require: 'magister-picture===custom',
            },
        ]
    },
    {
        id: "section-magister-today",
        group: "Magister",
        title: "Vandaag",
        settings: [
            {
                id: "magister-vd-overhaul",
                title: "Verbeterde pagina 'Vandaag'",
                default: true,
                require: "magister-css-experimental",
            },
            {
                id: "magister-vd-agendaHeight",
                title: "Hoogte agenda-items",
                type: "slider",
                default: 1,
                defaultFormatted: "1,0×",
                suffix: "×",
                min: 0.5,
                max: 2.5,
                step: 0.1,
                require: "magister-css-experimental magister-vd-overhaul",
            },
            {
                id: "magister-vd-subjects",
                title: "Aangepaste vaknamen",
                default: true,
                require: "magister-css-experimental magister-vd-overhaul",
            },
            {
                id: "magister-vd-grade",
                title: "Weergave laatste cijfers",
                type: "select",
                default: "full",
                require: "magister-css-experimental magister-vd-overhaul",
                options: [
                    {
                        value: "full",
                        title: "Volledig (cijfer weergeven)"
                    },
                    {
                        value: "partial",
                        title: "Gedeeltelijk (cijfer verbergen)"
                    },
                    {
                        value: "off",
                        title: "Uit"
                    },
                ]
            },
        ]
    },
    {
        id: "section-magister-grades",
        group: "Magister",
        title: "Cijfers",
        settings: [
            {
                id: "magister-cf-calculator",
                title: "Cijfercalculator",
                subtitle: "Een handige cijfercalculator met grafieken. Je kunt cijfers uit je cijferlijst toevoegen of aangepaste cijfers invoeren. Open met de knop rechtsboven in het cijferoverzicht.",
                default: true,
            },
            {
                id: "magister-cf-statistics",
                title: "Cijferstatistieken",
                subtitle: "[Experimenteel] Verscheidene statistieken en grafiekjes bij je cijfers, met handige filters. Te vinden onder het nieuwe tabblad in de zijbalk van het cijferoverzicht.",
                default: true,
            },
            {
                id: "magister-cf-backup",
                title: "Cijferback-up",
                subtitle: "Biedt de optie om je cijferoverzicht te exporteren en op een later moment weer te importeren. Gebruik met de knop rechtsboven in het cijferoverzicht.",
                default: true,
            },
            {
                id: "magister-cf-failred",
                title: "Onvoldoendes rood kleuren",
                subtitle: "Alleen in het cijferoverzicht.",
                default: true,
            }
        ]
    },
    {
        id: "section-magister-studiewijzers",
        group: "Magister",
        title: "Studiewijzers",
        settings: [
            {
                id: "magister-sw-display",
                title: "Weergave studiewijzers",
                type: "select",
                require: "magister-css-experimental",
                default: "grid",
                options: [
                    {
                        value: "grid",
                        title: "Geordend raster"
                    },
                    {
                        value: "list",
                        title: "Geordende lijst"
                    },
                    {
                        value: "off",
                        title: "Origineel"
                    },
                ]
            },
            {
                id: "magister-sw-period",
                title: "Periodenummers tonen",
                subtitle: "In plaats van de naam van de studiewijzer.",
                default: true,
                require: "magister-css-experimental magister-sw-display===grid",
            },
            {
                id: "magister-sw-thisWeek",
                title: "Naar huidige week scrollen",
                default: true,
            }
        ]
    },
    {
        id: "section-magister-gamification-beta",
        group: "Magister",
        title: "Gamificatie",
        settings: [
            {
                id: "magister-gamification-beta",
                title: "Gamificatie",
                subtitle: "Op de pagina 'Vandaag' kun je jouw punten bekijken. Punten worden toegekend op basis van je prestaties. Lees meer in het scoremenu.",
                default: false,
                class: 'beta',
                require: "beta-options magister-css-experimental",
            },
        ]
    },
    {
        id: "section-magister-values",
        group: "Magister",
        title: "Globale waarden",
        settings: [
            {
                id: "magister-periods",
                title: "Beginweken perioden",
                subtitle: "Het eerste weeknummer van elke periode, gescheiden door komma's.",
                type: "text",
                default: "30, 47, 9",
            },
            {
                id: "magister-subjects",
                title: "Aangepaste vaknamen",
                type: "subjects",
                default: [
                    { name: "Aardrijkskunde", aliases: "ak" },
                    { name: "Bedrijfseconomie", aliases: "beco" },
                    { name: "Beeldende vorming", aliases: "be, bv, kubv" },
                    { name: "Biologie", aliases: "bi, bio" },
                    { name: "Cult. en kunstz. vorming", aliases: "ckv" },
                    { name: "Drama", aliases: "dr, kudr" },
                    { name: "Duits", aliases: "du, dutl, Duitse, Deutsch" },
                    { name: "Economie", aliases: "ec, eco, econ" },
                    { name: "Engels", aliases: "en, entl, Engels, English" },
                    { name: "Frans", aliases: "fa, fatl, Franse, Français" },
                    { name: "Geschiedenis", aliases: "gs" },
                    { name: "Grieks", aliases: "gtc, gr, grtl, Griekse" },
                    { name: "Kunst algemeen", aliases: "ku, kua" },
                    { name: "Latijn", aliases: "ltc, la, latl, Latijnse" },
                    { name: "Levensbeschouwing", aliases: "lv" },
                    { name: "Sport", aliases: "lo, s&b, lichamelijke opvoeding, gym" },
                    { name: "Loopbaan&shy;ori\xebntatie en -begeleiding", aliases: "lob" },
                    { name: "Maatschappijleer", aliases: "ma, malv" },
                    { name: "Maatschappij&shy;wetenschappen", aliases: "maw" },
                    { name: "Mentor", aliases: "mentoruur, mentoraat" },
                    { name: "Muziek", aliases: "mu, kumu" },
                    { name: "Natuurkunde", aliases: "na, nat" },
                    { name: "Nederlands", aliases: "ne, netl, Nederlandse" },
                    { name: "Scheikunde", aliases: "sk, sch" },
                    { name: "Spaans", aliases: "sp, sptl, Spaanse, Español" },
                    { name: "Wiskunde", aliases: "wi, wa, wb, wc, wd, wisa, wisb, wisc, wisd" }
                ]
            }
        ]
    },
    {
        id: "section-dev",
        group: "Study Tools",
        title: "Opties",
        settings: [
            {
                id: "updates",
                title: "Updates aanbieden",
                subtitle: "Melding bij nieuwe versie.",
                devOnly: true,
            },
            {
                id: "update-notes",
                title: "Update-informatie weergeven",
                subtitle: "Een korte melding over de nieuwste update wordt weergegeven als er een nieuwe beschikbaar of onlangs geïnstalleerd is.",
                default: true,
            },
            {
                id: "beta-options",
                title: "Experimentele opties",
                subtitle: "Er verschijnen extra opties voor functies die nog niet af zijn.",
                class: 'beta',
                default: false,
            },
            {
                id: "beta",
                title: "Bètaversies aanbieden",
                subtitle: "Melding bij nieuwe bètaversie. Bevat de laatste bugfixes, maar kan ook nieuwe bugs bevatten. Je hebt altijd de keuze om de versie niet te installeren.",
                devOnly: true,
                class: 'beta',
                require: "beta-options updates",
            },
        ]
    },
]