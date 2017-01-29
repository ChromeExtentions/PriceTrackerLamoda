;
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
            var result = addProduct(request);
            if(result == 0) {
                sendResponse( { result: "Товар добавлен" } );
            }
            else if(result == 1) {
                sendResponse( { result: "Лимит отслеживаемых товаров исчерпан" } );
            }
        }
        catch(err) {
            sendResponse( { result: "Произошла ошибка. Попробуйте еще раз." } );
        }



        // if(typeof request.notify != 'undefined') {
        //     var opt = {
        //         type: "basic",
        //         title: "Primary Title",
        //         message: "Primary message to display",
        //         iconUrl: "icon.png"
        //     };
        //     chrome.notifications.create(opt);
        // }
    }
);

// chrome.browserAction.onClicked.addListener(function(tab) {
//     chrome.browserAction.setPopup({
//         popup: '!!!!!!!!'
//     });
// });

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



