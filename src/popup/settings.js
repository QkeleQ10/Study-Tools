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
        id: "section-magister-sidebar",
        group: "Magister",
        title: "Zijbalk",
        settings: [
            {
                id: "magister-appbar-week",
                title: "Weeknummer tonen"
            },
            {
                id: "magister-appbar-zermelo",
                title: "Link naar Zermelo tonen"
            },
            {
                id: "magister-appbar-zermelo-url",
                title: "Webadres Zermelo",
                subtitle: "Bijvoorbeeld 'school.zportal.nl/app'. Als dit niet wordt opgegeven, werkt de link soms nog wel.",
                type: "text",
                require: "magister-appbar-zermelo",
            },
            {
                id: "magister-appbar-hidePicture",
                title: "Profielfoto verbergen"
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
                title: "Alternatieve pagina 'Vandaag'",
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
                max: 1.5,
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
        id: "section-magister-assignments",
        group: "Magister",
        title: "Opdrachten",
        settings: [
            {
                id: "magister-op-oldgrey",
                title: "Oude opdrachten grijs kleuren",
                default: true,
            }
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
                subtitle: "Een zeer krachtige cijfercalculator met grafieken. Je kunt cijfers uit je cijferlijst toevoegen of aangepaste cijfers invoeren. Open met de knop rechtsboven in het cijferoverzicht.",
                default: true,
            },
            {
                id: "magister-cf-statistics",
                title: "Cijferstatistieken",
                subtitle: "Verscheidene statistieken en grafiekjesa. Open met de knop in de zijbalk van het cijferoverzicht.",
                default: true,
            },
            {
                id: "magister-cf-backup",
                title: "Cijferback-up",
                subtitle: "Biedt de optie om je cijferoverzicht te exporteren en op een later moment weer te importeren.",
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
                default: [{ name: "Aardrijkskunde", aliases: "ak" }, { name: "Bedrijfseconomie", aliases: "beco" }, { name: "Beeldende vorming", aliases: "be, bv, kubv" }, { name: "Biologie", aliases: "bi" }, { name: "Cult. en kunstz. vorming", aliases: "ckv" }, { name: "Drama", aliases: "dr, kudr" }, { name: "Duitse taal", aliases: "du, dutl" }, { name: "Economie", aliases: "ec" }, { name: "Engelse taal", aliases: "en, entl" }, { name: "Franse taal", aliases: "fa, fatl" }, { name: "Geschiedenis", aliases: "gs" }, { name: "Kunst algemeen", aliases: "ku, kua" }, { name: "Levensbeschouwing", aliases: "lv" }, { name: "Lichamelijke opvoeding", aliases: "lo" }, { name: "Loopbaan&shy;ori\xebntatie en -begeleiding", aliases: "lob" }, { name: "Maatschappijleer", aliases: "ma, malv" }, { name: "Maatschappij&shy;wetenschappen", aliases: "maw" }, { name: "Mentor", aliases: "mentoruur, mentoraat" }, { name: "Muziek", aliases: "mu, kumu" }, { name: "Natuurkunde", aliases: "na" }, { name: "Nederlandse taal", aliases: "ne, netl" }, { name: "Scheikunde", aliases: "sk" }, { name: "Spaanse taal", aliases: "sp, sptl" }, { name: "Wiskunde", aliases: "wi, wa, wb, wc, wd" }]
            }
        ]
    },
    {
        id: "section-noordhoff",
        group: "Noordhoff",
        title: "Inloggen",
        settings: [
            {
                id: "noordhoff-login-enabled",
                title: "Automatisch doorgaan"
            },
            // {
            //     id: "noordhoff-login-entree",
            //     title: "Inloggen met Entree"
            // },
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
                id: "beta",
                title: "Bètaversies aanbieden",
                subtitle: "Melding bij nieuwe bètaversie. Bevat de laatste bugfixes, maar kan ook nieuwe bugs bevatten. Je hebt altijd de keuze om de versie niet te installeren.",
                devOnly: true,
                require: "updates",
            },
            {
                id: "update-notes",
                title: "Update-informatie weergeven",
                subtitle: "Een korte melding over de nieuwste update wordt weergegeven als er een nieuwe beschikbaar of onlangs geïnstalleerd is.",
                default: true,
            },
        ]
    },
]