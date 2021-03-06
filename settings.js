;
function applyEmbeddedSettings() {

    //======================== Для тестов менять только тут ========================
    var testApplication = false;
    //==============================================================================



    if (testApplication === false) {
        window.settings = {
            updateInterval: 8,
            changeThresholdUnitRub: 100,
            changeThresholdUnitPercent: 4,
            changeThresholdUnit: 'rouble',
            missingAfterDays: 7,
            trackIfMissing: true,
            missingCheckPeriod: 7,
            missingCheckTimes: 4,
            maxPriceToShow: 2,
            maxProductCount: 60,
            maxProductCountUpdatePerTime: 5,
            maxNotificationCount: 10,
            randomizeIntervalMinutes: 60,
            GA: {
                ID: 'UA-91379404-02',
                tracker: 'MyTracker',
                catetories: {
                    main: 'chromeExtension'
                },
                actions: {
                    showTrackButton: 'showTrackButton',
                    showTrackButtonHasProduct: 'showTrackButtonHasProduct',
                    trackProduct: 'trackProduct',
                    productLimitReached: 'productLimitReached',
                    tableProductClick: 'tableProductClick',
                    notificationFired: 'notificationFired',
                    notificationClick: 'notificationClick',
                    removeProduct: 'removeProduct',
                    removeProductAuto: 'removeProductAuto'
                },
                labels: {
                    showTrackButton: 'Label_showTrackButton',
                    showTrackButtonHasProduct: 'Label_showTrackButtonHasProduct',
                    trackProduct: 'Label_trackProduct',
                    productLimitReached: 'Label_productLimitReached',
                    tableProductClick: 'Label_tableProductClick',
                    notificationFired: 'Label_notificationFired',
                    notificationClick: 'Label_notificationClick',
                    removeProduct: 'Label_removeProduct',
                    removeProductAuto: 'Label_removeProductAuto'
                }
            },
            testApp: false
        };
    }
    else {
        window.settings = {
            updateInterval: 20, // в секундах
            changeThresholdUnitRub: 100,
            changeThresholdUnitPercent: 4,
            changeThresholdUnit: 'rouble',
            missingAfterDays: 0.0007, // В итоге получится 1 минута
            trackIfMissing: true,
            missingCheckPeriod: 0.0000014, // В итоге получится 2 минуты
            missingCheckTimes: 4,
            maxPriceToShow: 3,
            maxProductCount: 6,
            maxProductCountUpdatePerTime: 3,
            maxNotificationCount: 10,
            randomizeIntervalMinutes: 10,
            testApp: true,
            GA: {
                ID: 'UA-91379404-02',
                tracker: 'MyTracker',
                catetories: {
                    main: 'chromeExtension'
                },
                actions: {
                    showTrackButton: 'showTrackButton',
                    showTrackButtonHasProduct: 'showTrackButtonHasProduct',
                    trackProduct: 'trackProduct',
                    productLimitReached: 'productLimitReached',
                    tableProductClick: 'tableProductClick',
                    notificationFired: 'notificationFired',
                    notificationClick: 'notificationClick',
                    removeProduct: 'removeProduct',
                    removeProductAuto: 'removeProductAuto'
                },
                labels: {
                    showTrackButton: 'Label_showTrackButton',
                    showTrackButtonHasProduct: 'Label_showTrackButtonHasProduct',
                    trackProduct: 'Label_trackProduct',
                    productLimitReached: 'Label_productLimitReached',
                    tableProductClick: 'Label_tableProductClick',
                    notificationFired: 'Label_notificationFired',
                    notificationClick: 'Label_notificationClick',
                    removeProduct: 'Label_removeProduct',
                    removeProductAuto: 'Label_removeProductAuto'
                }
            },
            pathToTestProducts: 'C://Users//user//Desktop//extension//PriceTracker//'
        }
    }
}

