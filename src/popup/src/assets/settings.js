export default [
    {
        id: "appearance",
        settings: [
            // THIS ONE NEEDS TO BE INVERTED AND PLACED UNDER DEV OPTIONS!
            // {
            //     id: "magister-css-experimental",
            //     title: "Verbeteringen aan uiterlijk",
            //     subtitle: "Veel functies van Study Tools werken mogelijk niet goed als dit is uitgeschakeld.",
            //     default: true,
            // },
            {
                id: "theme",
                title: "Kleurenschema",
                type: "SegmentedButton",
                wizard: "Kies in welk kleurenthema Magister moet worden weergegeven.",
                default: "auto",
                options: [
                    {
                        value: "auto",
                        title: "Systeem",
                        icon: "brightness_auto"
                    },
                    {
                        value: "light",
                        title: "Licht",
                        icon: "light_mode"
                    },
                    {
                        value: "dark",
                        title: "Donker",
                        icon: "dark_mode"
                    },
                ]
            },
            {
                id: "color",
                title: "Accentkleur",
                type: "ColorPicker",
                default: { h: 207, s: 95, l: 55 },
                wizard: "Wil je een alternatieve accentkleur kiezen?",
            },
            {
                id: "magister-css-border-radius",
                title: "Afgeronde hoeken",
                type: "SlideInput",
                default: 8,
                format: "px",
                decimals: 0,
                min: 0,
                max: 20,
                step: 1,
            },
            // DEV OPTION?
            // {
            //     id: "magister-css-dark-invert",
            //     title: "Inhoud donker maken",
            //     subtitle: "[Experimenteel] Studiewijzers en opdrachten donker maken indien het donkere thema actief is.",
            //     default: true,
            // },
            {
                id: "magister-appbar-week",
                title: "Weeknummer in zijbalk",
                default: true,
            },
            {
                id: 'magister-picture',
                title: "Profielfoto",
                type: "SegmentedButton",
                default: 'hide',
                options: [
                    {
                        value: "show",
                        title: "Schoolfoto",
                        icon: "photo_camera_front"
                    },
                    {
                        value: "custom",
                        title: "Aangepast",
                        icon: "add_photo_alternate"
                    },
                    {
                        value: "hide",
                        title: "Verbergen",
                        icon: "visibility_off"
                    },
                ],
            },
            {
                id: 'magister-picture-source',
                title: "Aangepaste profielfoto",
                type: "ImageInput",
                conditions: [
                    { settingId: 'magister-picture', operator: 'equal', value: 'custom' }
                ],
            },
            {
                id: "magister-cf-failred",
                title: "Onvoldoendes rood kleuren",
                subtitle: "Alleen in het cijferoverzicht.",
                default: true,
            },
        ]
    },
    {
        id: "login",
        wizard: "Kies de manier van inloggen op je school om automatisch inloggen in te schakelen.",
        settings: [
            {
                id: "magisterLogin-method",
                title: "Automatisch inloggen",
                subtitle: "Log automatisch in met je Microsoft-account of met een Magister-wachtwoord.",
                type: "SegmentedButton",
                default: "microsoft",
                options: [
                    {
                        value: "microsoft",
                        title: "Microsoft"
                    },
                    {
                        value: "password",
                        title: "Wachtwoord",
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
                type: "TextInput",
                conditions: [
                    { settingId: 'magisterLogin-method', operator: 'not equal', value: 'off' }
                ],
            },
            {
                id: "magisterLogin-email",
                title: "E-mailadres",
                subtitle: "Van het Microsoft-account dat moet worden gekozen.",
                type: "TextInput",
                fieldType: "email",
                conditions: [
                    { settingId: 'magisterLogin-method', operator: 'equal', value: 'microsoft' }
                ],
            },
            {
                id: "magisterLogin-password",
                title: "Wachtwoord",
                type: "TextInput",
                fieldType: "password",
                conditions: [
                    { settingId: 'magisterLogin-method', operator: 'equal', value: 'password' }
                ],
            },
        ]
    },
    {
        id: "enhancements",
        settings: [
            {
                id: "magister-vd-overhaul",
                title: "Verbeterd startscherm",
                default: true,
            },
            {
                id: "magister-vd-agendaHeight",
                title: "Hoogte agenda",
                type: "SlideInput",
                default: 1,
                format: "percent",
                decimals: 0,
                min: 0.5,
                max: 2.5,
                step: 0.1,
                conditions: [
                    { settingId: 'magister-vd-overhaul', operator: 'equal', value: true }
                ],
            },
            // TURN THIS INTO A SEGMENTEDBUTTON
            // {
            //     id: "magister-vd-subjects",
            //     title: "Aangepaste vaknamen",
            //     default: true,
            // },
            // {
            //     id: "magister-vd-subjects",
            //     title: "Vaknotatie in agenda",
            //     type: "SegmentedButton",
            //     default: "true",
            // conditions: [
            //     { settingId: 'magister-vd-overhaul', operator: 'equal', value: true }
            // ],
            //     options: [
            //         {
            //             value: "custom",
            //             title: "Vaknamen",
            //             icon: "notes"
            //         },
            //         {
            //             value: "default",
            //             title: "Vakafkortingen",
            //             icon: "short_text"
            //         },
            //     ],
            // },
            {
                id: "magister-vd-grade",
                title: "Laatste cijfer op startscherm",
                subtitle: "Toon het laatste cijfer op het startscherm, laat alleen zien hoeveel nieuwe cijfers er zijn of toon helemaal niets.",
                type: "SegmentedButton",
                default: "full",
                conditions: [
                    { settingId: 'magister-vd-overhaul', operator: 'equal', value: true }
                ],
                options: [
                    {
                        value: "full",
                        title: "Volledig",
                        icon: "star"
                    },
                    {
                        value: "partial",
                        title: "Aantal",
                        icon: "app_badging"
                    },
                    {
                        value: "off",
                        title: "Verbergen",
                        icon: "visibility_off"
                    },
                ]
            },
            {
                id: "magister-cf-calculator",
                title: "Cijfercalculator",
                subtitle: "Een handige cijfercalculator met grafieken. Je kunt cijfers uit je cijferlijst toevoegen of aangepaste cijfers invoeren. Open met de knop rechtsboven in het cijferoverzicht.",
                default: true,
            },
            {
                id: "magister-cf-statistics",
                title: "Cijferstatistieken",
                subtitle: "Verscheidene statistieken en grafiekjes bij je cijfers, met handige filters. Te vinden onder het nieuwe tabblad in de zijbalk van het cijferoverzicht.",
                default: true,
            },
            // ADD A LINK TO THE WEBSITE!
            {
                id: "magister-cf-backup",
                title: "Cijferback-up",
                subtitle: "Biedt de optie om je cijferoverzicht te exporteren en op een later moment weer te importeren. Gebruik met de knop rechtsboven in het cijferoverzicht.",
                default: true,
            },
            {
                id: "magister-sw-display",
                title: "Studiewijzers ordenen",
                type: "SegmentedButton",
                default: "grid",
                options: [
                    {
                        value: "grid",
                        title: "Raster",
                        icon: "grid_view"
                    },
                    {
                        value: "list",
                        title: "Lijst",
                        icon: "sort"
                    },
                    {
                        value: "off",
                        title: "Uit",
                        icon: "block"
                    },
                ]
            },
            {
                id: "magister-sw-period",
                title: "Periodenummers bij studiewijzers",
                subtitle: "In plaats van de naam van de studiewijzer.",
                default: true,
                conditions: [
                    { settingId: 'magister-sw-display', operator: 'equal', value: 'grid' }
                ],
            },
            // MAKE THIS A SEGMENTEDBUTTON
            // {
            //     id: "magister-sw-thisWeek",
            //     title: "Naar huidige week in studiewijzer",
            //     default: true,
            // },
            // {
            //     id: "magister-sw-thisWeek",
            //     title: "Huidige week in studiewijzer",
            //     type: "SegmentedButton",
            //     default: "focus",
            //     options: [
            //         {
            //             value: "focus",
            //             title: "Scrollen",
            //             icon: "bolt"
            //         },
            //         {
            //             value: "highlight",
            //             title: "Markeren",
            //             icon: "ink_highlighter"
            //         },
            //         {
            //             value: "off",
            //             title: "Uit",
            //             icon: "block"
            //         },
            //     ]
            // },
        ]
    },
    {
        id: "overlay",
        settings: [
            {
                id: 'magister-overlay-hotkey',
                title: "Activatietoets",
                subtitle: "Deze toets activeert de overlay en sneltoetsen.",
                type: "KeyPicker",
                default: "S",
            },
            {
                id: 'magister-shortcuts',
                title: "Sneltoetsen",
                subtitle: "Houd de activatietoets ingedrukt en druk op een getal op je toetsenbord voor snelle navigatie.",
                default: true,
                conditions: [
                    { settingId: 'magister-overlay-hotkey', operator: 'defined' }
                ],
            },
            {
                id: 'magister-shortcuts-today',
                title: "Snellere sneltoetsen",
                subtitle: "Op de startpagina zijn sneltoetsen bruikbaar zonder de activatietoets ingedrukt te hoeven houden.",
                default: true,
                conditions: [
                    { settingId: 'magister-overlay-hotkey', operator: 'defined' },
                    { settingId: 'magister-shortcuts', operator: 'equal', value: true }
                ],
            },
            {
                id: 'magister-notes-beta2',
                title: "Notitieblok",
                default: false,
                conditions: [
                    { settingId: 'magister-overlay-hotkey', operator: 'defined' },
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
            // INCORPORATE INTO THE OVERLAY
            // BROWSER NOT EQUAL OPERATOR
            {
                id: "magister-gamification-beta",
                title: "Gamificatie",
                subtitle: "Punten worden toegekend op basis van je prestaties. Lees meer in het scoremenu.",
                default: false,
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true },
                    { operator: 'browser not equal', value: 'firefox' }
                ],
            },
        ]
    },
    {
        id: "data",
        group: "Magister",
        title: "Globale waarden",
        settings: [
            // MAKE THESE AVAILABLE WHEREVER NECESSARY
            // {
            //     id: "magister-periods",
            //     title: "Beginweken perioden",
            //     subtitle: "Het eerste weeknummer van elke periode, gescheiden door komma's.",
            //     type: "TextInput",
            //     default: "30, 47, 9",
            // },
            // {
            //     id: "magister-subjects",
            //     title: "Aangepaste vaknamen",
            //     type: "subjects",
            //     default: [
            //         { name: "Aardrijkskunde", aliases: "ak" },
            //         { name: "Bedrijfseconomie", aliases: "beco" },
            //         { name: "Beeldende vorming", aliases: "be, bv, kubv" },
            //         { name: "Biologie", aliases: "bi, bio" },
            //         { name: "Cult. en kunstz. vorming", aliases: "ckv" },
            //         { name: "Drama", aliases: "dr, kudr" },
            //         { name: "Duits", aliases: "du, dutl, Duitse, Deutsch" },
            //         { name: "Economie", aliases: "ec, eco, econ" },
            //         { name: "Engels", aliases: "en, entl, Engels, English" },
            //         { name: "Frans", aliases: "fa, fatl, Franse, Français" },
            //         { name: "Geschiedenis", aliases: "gs" },
            //         { name: "Grieks", aliases: "gtc, gr, grtl, Griekse" },
            //         { name: "Kunst algemeen", aliases: "ku, kua" },
            //         { name: "Latijn", aliases: "ltc, la, latl, Latijnse" },
            //         { name: "Levensbeschouwing", aliases: "lv" },
            //         { name: "Sport", aliases: "lo, s&b, lichamelijke opvoeding, gym" },
            //         { name: "Loopbaan&shy;ori\xebntatie en -begeleiding", aliases: "lob" },
            //         { name: "Maatschappijleer", aliases: "ma, malv" },
            //         { name: "Maatschappij&shy;wetenschappen", aliases: "maw" },
            //         { name: "Mentor", aliases: "mentoruur, mentoraat" },
            //         { name: "Muziek", aliases: "mu, kumu" },
            //         { name: "Natuurkunde", aliases: "na, nat" },
            //         { name: "Nederlands", aliases: "ne, netl, Nederlandse" },
            //         { name: "Scheikunde", aliases: "sk, sch" },
            //         { name: "Spaans", aliases: "sp, sptl, Spaanse, Español" },
            //         { name: "Wiskunde", aliases: "wi, wa, wb, wc, wd, wisa, wisb, wisc, wisd" }
            //     ]
            // }
        ]
    },
    {
        id: "about",
        settings: [
            {
                id: "update-notes",
                title: "Update-informatie weergeven",
                subtitle: "Af en toe een korte melding over de nieuwste updates weergeven.",
                default: true,
            },
            {
                id: "beta-options",
                title: "Experimentele opties",
                subtitle: "Er verschijnen extra opties voor functies die nog niet af zijn.",
                default: false,
            },
            {
                id: "updates",
                title: "Updates aanbieden",
                subtitle: "Melding bij nieuwe versie.",
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
            {
                id: "beta",
                title: "Bètaversies aanbieden",
                subtitle: "Melding bij nieuwe bètaversie. Bevat de laatste bugfixes, maar kan ook nieuwe bugs bevatten.",
                conditions: [
                    { settingId: 'updates', operator: 'equal', value: true },
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
        ]
    },
]