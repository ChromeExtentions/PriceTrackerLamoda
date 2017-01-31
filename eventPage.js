;
// Загрузка настроек расширения
window.settings = {};
applySettings();

var alarmInfo = chrome.storage.local.get('priceChecker_task', function() {});
if(typeof alarmInfo == 'undefined' || alarmInfo == null || alarmInfo.periodInMinutes == 'undefined' || alarmInfo.periodInMinutes == null) {
    alarmInfo = { when: 1000, periodInMinutes: 1 };
    chrome.alarms.create('priceChecker', alarmInfo);
    chrome.storage.local.set( {'priceChecker_task':  alarmInfo });
}
chrome.alarms.onAlarm.addListener(
    function() {
        //updatePrices();
        chrome.storage.local.get('priceChecker_test', function(result) {
            // alert(result.priceChecker_test);
        });
    }
);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        try {
            addProduct(request, sendResponse);
        }
        catch(err) {
            sendResponse( { result: "Произошла ошибка. Попробуйте еще раз." } );
            return;
        }
        return true;
    }
);

function applySettings() {
    window.settings = {
        updateInterval: '8',
        changeThresholdUnitRub: 100,
        changeThresholdUnitPercent: 4,
        changeThresholdUnit: 'rouble',
        missingAfterDays: 7,
        trackIfMissing: true,
        missingCheckPeriod: 7,
        missingCheckTimes: 4,
        maxPriceToShow: 10,
        maxProductCount: 60
    };
    chrome.storage.sync.set( window.settings , function(result) {
        var i=0;
    });
}


function updatePrices() {
    var url = 'https://market.yandex.ru/product/13925684?show-uid=849459940624320842016001&nid=56181';
    if( !lockUpdate() ) {
        return;
    }
    $.ajax(
        {
            type: 'GET',
            url: url
        }
    ).done(
        function(data) {
            var i=0;
        }
    ).fail(
        function() {
        }
    ).always(
        function() {
            unlockUpdate();
        }
    );
}

function lockUpdate() {
    var updateObj = chrome.storage.local.get('priceChecker_updateObject', function() {});
    if(typeof updateObj == 'undefined' || updateObj == null) {
        updateObj = {
            lastTime: new Date().getTime(),
            lock: true
        };
    }
    else {
        var nowTime = new Date().getTime();
        if(nowTime - updateObj.lastTime < 60000 || updateObj.lock == true) {
            return false;
        }
    }

    chrome.storage.local.set( {'priceChecker_updateObject':  updateObj });
    return true;
}

function unlockUpdate() {
    var updateObj = {
        lastTime: new Date().getTime(),
        lock: false
    };
    chrome.storage.local.set( {'priceChecker_updateObject':  updateObj });
}

function getProducts() {
    var products = chrome.storage.local.get('priceChecker_products', function() {});
    if(typeof products == 'undefined' || products == null) {
        products = [
            {
                "name": "",
                "price": 0.0,
                "url": ""
            }
        ]
    }
}
//
//function bufferToBase64(buf) {
//    var binstr = Array.prototype.map.call(buf, function (ch) {
//        return String.fromCharCode(ch);
//    }).join('');
//    return btoa(binstr);
//}
//
//function _base64ToArrayBuffer(base64) {
//    var binary_string =  window.atob(base64);
//    var len = binary_string.length;
//    var bytes = new Uint8Array( len );
//    for (var i = 0; i < len; i++)        {
//        bytes[i] = binary_string.charCodeAt(i);
//    }
//    return bytes.buffer;
//}
//
