export default [
    {
        id: "theme",
        settings: [
            {
                id: "ptheme",
                title: "Algemeen",
                type: "ThemeColors",
                default: 'auto,207,95,55',
            },
            {
                id: "pagecolor",
                title: "Achtergrondkleur",
                subtitle: "Achtergrond",
                type: "ColorOverrideSetting",
                default: 'false,0,0,7',
            },
            {
                id: "wallpaper",
                title: "Achtergrondafbeelding",
                type: "DecorationPickerSetting",
                default: 'none,',
            },
            {
                id: "wallpaper-opacity",
                title: "Achtergrondtransparantie",
                type: "Slider",
                display: "inline",
                default: 0.2,
                format: "percent",
                decimals: 0,
                min: 0.05,
                max: 1,
                step: 0.05,
                conditions: [
                    { settingId: 'wallpaper', operator: 'not starting with', value: 'none' }
                ],
            },
            {
                id: "sidecolor",
                title: "Menubalkkleur",
                subtitle: "Menubalk",
                type: "ColorOverrideSetting",
                default: 'false,207,95,55',
            },
            {
                id: "decoration",
                title: "Menubalkdecoratie",
                type: "DecorationPickerSetting",
                default: 'none,',
            },
            {
                id: "decoration-size",
                title: "Menubalkdecoratieformaat",
                type: "Slider",
                display: "inline",
                default: 1,
                format: "percent",
                decimals: 0,
                min: 0.5,
                max: 3,
                step: 0.1,
                conditions: [
                    { settingId: 'decoration', operator: 'not starting with', value: 'none' }
                ],
            },
            {
                id: "appbarcolor",
                title: "Appbalkkleur",
                subtitle: "Appbalk",
                type: "ColorOverrideSetting",
                default: 'false,207,95,47',
            },
            {
                id: "shape",
                title: "Hoekstraal",
                type: "Slider",
                default: 8,
                format: "px",
                decimals: 0,
                min: 0,
                max: 20,
                step: 1,
            },
            {
                id: "custom-css",
                title: "Aangepaste CSS",
                type: "LinkToOptionsTab",
                default: '',
            },
            {
                id: "custom-css2",
                hide: true,
                default: '',
            },
        ]
    },
    {
        id: "login",
        settings: [
            {
                id: "magisterLogin-enabled",
                title: "Automatisch inloggen",
                default: true
            },
            {
                id: "magisterLogin-username",
                title: "Gebruikersnaam",
                subtitle: "Je gebruikersnaam wordt vanzelf ingevoerd.",
                type: "Text",
                default: '',
                conditions: [
                    { settingId: 'magisterLogin-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "magisterLogin-email",
                title: "Microsoft-account",
                subtitle: "Vul het e-mailadres in van je Microsoft-schoolaccount—als je school gebruikmaakt van Single Sign On via Microsoft. Dit account wordt tijdens het inloggen aangeklikt.",
                type: "Text",
                fieldType: "email",
                default: '',
                conditions: [
                    { settingId: 'magisterLogin-enabled', operator: 'equal', value: true }
                ],
            },
        ]
    },
    {
        id: "sidebar",
        settings: [
            {
                id: "magister-appbar-week",
                title: "Weeknummer in menubalk",
                default: true,
            },
            {
                id: "shortcuts",
                title: "Snelkoppelingen menubalk",
                type: "ShortcutsEditor",
                default: [
                    { icon: '', href: '$SCHOOLNAAM.zportal.nl/app', hotkey: 'z' }
                ]
            },
            {
                id: 'magister-picture',
                title: "Profielfoto",
                type: "SingleChoice",
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
                title: "Profielfoto kiezen",
                type: "ImageInput",
                default: null,
                conditions: [
                    { settingId: 'magister-picture', operator: 'equal', value: 'custom' },
                ],
            },

            {
                id: 'hotkeys-enabled',
                title: "Sneltoetsen",
                subtitle: "Houd Alt ingedrukt en druk op een letter op je toetsenbord voor snelle navigatie.",
                default: true,
            },
            // {
            //     id: 'hotkeys-quick',
            //     title: "Snellere sneltoetsen",
            //     subtitle: "Op de startpagina zijn sneltoetsen bruikbaar zonder Alt ingedrukt te hoeven houden.",
            //     default: false,
            //     conditions: [
            //         { settingId: 'hotkeys-enabled', operator: 'equal', value: true },
            //     ],
            // },
        ]
    },
    {
        id: "start",
        settings: [
            {
                id: "start-enabled",
                title: "Pagina Start",
                subtitle: "De pagina 'Vandaag' is nu 'Start'. Daarin zie je je rooster en gepersonaliseerde widgets. Aanvullende opties op Magister zelf.",
                default: true,
            },
            {
                id: "start-schedule-view",
                title: "Roosterlay-out",
                type: "SingleChoice",
                default: "schedule",
                conditions: [
                    { settingId: 'start-enabled', operator: 'equal', value: true }
                ],
                options: [
                    {
                        value: "schedule",
                        title: "Agenda",
                        icon: "calendar_view_day"
                    },
                    {
                        value: "list",
                        title: "Lijst",
                        icon: "list"
                    },
                ],
            },
            {
                id: "start-event-display",
                title: "Roosterafspraken",
                type: "SingleChoice",
                default: "normal",
                conditions: [
                    { settingId: 'start-enabled', operator: 'equal', value: true }
                ],
                options: [
                    {
                        value: "normal",
                        title: "Modern",
                        icon: "psychology"
                    },
                    {
                        value: "legacy",
                        title: "Klassiek",
                        icon: "smartphone"
                    },
                ],
            },
            {
                id: "start-schedule-extra-day",
                title: "Volgende roosterdag tonen",
                subtitle: "Springen naar de eerstvolgende dag met lessen wanneer er vandaag geen lessen (meer) zijn. Alleen in de weergavemodus 'Dag'.",
                default: true,
                conditions: [
                    { settingId: 'start-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "start-schedule-view-persist",
                title: "Laatst bekeken roosterweergave onthouden",
                subtitle: "De laatst gebruikte roosterweergave wordt onthouden zelfs als je Magister sluit.",
                default: false,
                conditions: [
                    { settingId: 'start-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "start-event-details",
                title: "Afspraakdetails in dialoogvenster",
                subtitle: "Als je klikt op een roosterafspraak, wordt er een dialoogvenster geopend met meer informatie over de afspraak.",
                default: true,
                conditions: [
                    { settingId: 'start-enabled', operator: 'equal', value: true }
                ],
            }
        ]
    },
    {
        id: "grades",
        settings: [
            {
                id: "cc",
                title: "Vernieuwd cijferoverzicht",
                subtitle: "Met handige cijfercalculator, leuke statistieken en een back-upfunctie.",
                default: true,
            },
            {
                id: "insufficient",
                title: "Onvoldoendes in cijferoverzicht",
                type: "SingleChoice",
                default: "underline",
                options: [
                    {
                        value: "underline",
                        title: "Rode onderstreping",
                        icon: "format_underlined"
                    },
                    {
                        value: "textcolor",
                        title: "Rode tekstkleur",
                        icon: "format_color_text"
                    },
                    {
                        value: "background",
                        title: "Rode achtergrond",
                        icon: "format_color_fill"
                    },
                    {
                        value: "off",
                        title: "Niet anders kleuren",
                        icon: "block"
                    },
                ]
            },
            // {
            //     id: "grade-col-grouping",
            //     title: "Cijfers groeperen op",
            //     type: "SingleChoice",
            //     default: "KolomNummer",
            //     options: [
            //         {
            //             value: "KolomNummer",
            //             title: "Kolomnummer"
            //         },
            //         {
            //             value: "KolomKop",
            //             title: "Kolomkop"
            //         },
            //     ]
            // },
            {
                id: "c-minimum",
                title: "Ondergrens cijfers",
                type: "Slider",
                default: 1.0,
                decimals: 1,
                min: 0,
                max: 100,
                step: 1,
            },
            {
                id: "c-maximum",
                title: "Bovengrens cijfers",
                type: "Slider",
                default: 10.0,
                decimals: 1,
                min: 0,
                max: 100,
                step: 1,
            },
            {
                id: "suf-threshold",
                title: "Voldoendegrens",
                type: "Slider",
                default: 5.5,
                decimals: 1,
                min: 'c-minimum',
                max: 'c-maximum',
                step: 0.1,
            },
            {
                id: "ignore-grade-columns",
                title: "Te negeren cijferkolommen",
                subtitle: "Cijferkolommen met deze kolomkoppen worden op sommige plekken genegeerd. Gescheiden door puntkomma's (;).",
                type: "Text",
                default: "%klaar;#tedoen;#gedaan;gedr;verantw;welb;capa"
            }
        ]
    },
    {
        id: "studyguide",
        settings: [
            {
                id: "sw-enabled",
                title: "Studiewijzers rangschikken",
                subtitle: "Studiewijzers zullen worden gegroepeerd op vak.",
                default: true,
            },
            {
                id: "sw-cols",
                title: "Aantal kolommen",
                type: "Slider",
                default: 3,
                decimals: 0,
                min: 1,
                max: 5,
                step: 1,
                conditions: [
                    { settingId: 'sw-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "sw-period",
                title: "Periodenummers bij studiewijzers",
                subtitle: "In plaats van de naam van de studiewijzer.",
                default: true,
                conditions: [
                    { settingId: 'sw-enabled', operator: 'equal', value: true }
                ],
            },
            {
                id: "sw-current-week-behavior",
                title: "Huidige week in studiewijzer",
                type: "SingleChoice",
                default: "focus",
                options: [
                    {
                        value: "focus",
                        title: "Scrollen",
                        icon: "bolt"
                    },
                    {
                        value: "highlight",
                        title: "Markeren",
                        icon: "ink_highlighter"
                    },
                    {
                        value: "off",
                        title: "Uit",
                        icon: "block"
                    },
                ]
            },
            {
                id: "sw-resources-auto",
                title: "Aanbevelingen",
                subtitle: "Soms wordt er een gecureerde collectie hulpbronnen getoond in de zijbalk.",
                default: true,
            },
        ]
    },
    {
        id: "about",
        settings: [
            {
                id: 'language',
                title: "Taal",
                subtitle: "Experimenteel",
                type: "SingleChoice",
                default: 'nl-NL',
                options: [
                    {
                        value: "nl-NL",
                        title: "Nederlands"
                    },
                    {
                        value: "en-GB",
                        title: "English"
                    },
                    {
                        value: "fr-FR",
                        title: "Français"
                    },
                    {
                        value: "de-DE",
                        title: "Deutsch"
                    },
                    {
                        value: "sv-SE",
                        title: "Svenska"
                    },
                    {
                        value: "la-LA",
                        title: "Latina lingua"
                    },
                ],
            },
            {
                id: "beta-options",
                title: "Ontwikkelaarsopties",
                subtitle: "Experimenteel",
                default: false,
            },
            {
                id: "darken-content",
                title: "Inhoud donker maken",
                subtitle: "Experimenteel. Studiewijzers en opdrachten donker maken indien het donkere thema actief is.",
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
                default: true,
            },
            {
                id: "verbosity",
                title: "Uitgebreide consoleberichten",
                subtitle: "Experimenteel. Er worden meer activiteiten geplaatst in de console.",
                default: false,
                conditions: [
                    { settingId: 'beta-options', operator: 'equal', value: true }
                ],
            },
            // TODO: setting to disable color adaptation for dark theme
        ]
    },
]