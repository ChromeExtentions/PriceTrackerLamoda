;
function applyEmbeddedSettings() {
//=================================== PROD ====================================
// window.settings = {
//     updateInterval: '8',
//     changeThresholdUnitRub: 100,
//     changeThresholdUnitPercent: 4,
//     changeThresholdUnit: 'rouble',
//     missingAfterDays: 7,
//     trackIfMissing: true,
//     missingCheckPeriod: 7,
//     missingCheckTimes: 4,
//     maxPriceToShow: 2,
//     maxProductCount: 60,
//     maxProductCountUpdatePerTime: 5,
//     maxNotificationCount: 10,
//     testApp: false
// };

//=================================== TEST ====================================

    window.settings = {
        updateInterval: 20, // в секундах
        changeThresholdUnitRub: 100,
        changeThresholdUnitPercent: 4,
        changeThresholdUnit: 'rouble',
        missingAfterDays: 0.0007, // В итоге получится 1 минута
        trackIfMissing: true,
        missingCheckPeriod: 0.0000014, // В итоге получится 2 минуты
        missingCheckTimes: 4,
        maxPriceToShow: 2,
        maxProductCount: 6,
        maxProductCountUpdatePerTime: 3,
        maxNotificationCount: 10,
        testApp: true,
        pathToTestProducts: 'file:///C:/projects/PriceTrackerLamoda/'
    };
}
