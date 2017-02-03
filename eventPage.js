;
onAlarmListener();

//--- Загрузка настроек расширения
    window.settings = {};
    applySettings();

//--- Запуск периодической фоновой задачи (выполняется каждую минуту)
    addAlarm();

//--- Слушатель запуска фоновой задачи
//    chrome.alarms.onAlarm.addListener(onAlarmListener);

//--- Слушатель входящих сообщений (с сайта: добавить товар)
    chrome.runtime.onMessage.addListener(onMessageListener);

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
        maxProductCount: 60,
        maxProductCountUpdatePerTime: 5,
        maxNotificationCount: 10
    };
    chrome.storage.sync.set( window.settings , function(result) {
    });
}

function addAlarm() {
    var alarmInfo = chrome.storage.local.get('priceChecker_task', function() {});
    if(typeof alarmInfo == 'undefined' || alarmInfo == null || alarmInfo.periodInMinutes == 'undefined' || alarmInfo.periodInMinutes == null) {
        alarmInfo = { when: 1000, periodInMinutes: 1 };
        chrome.alarms.create('priceChecker', alarmInfo);
        chrome.storage.local.set( {'priceChecker_task':  alarmInfo });
    }
}

//=============================== ВОТ ТУТ ВСЕ ОТСЛЕЖИВАНИЕ И ПРОИСХОДИТ ===================================
function onAlarmListener() {
    fireNotifications({});

    // getProductUpdateList()
    //     .then(randomizeProductUpdateTime)
    //     .then(downloadProductUpdates)
    //     .then(updatePricesFromSite)
    //    .then(fireNotifications);
}

// Сообщение со страницы о добавлении товара
function onMessageListener(request, sender, sendResponse) {
    try {
        addProduct(request, sendResponse);
    }
    catch(err) {
        sendResponse( { result: "Произошла ошибка. Попробуйте еще раз." } );
        return;
    }
    return true;
}


function fireNotifications(changes) {
    var changes = [];
    changes.push( { code: 'AAA1', oldPrice: 100, newPrice: 200 } );
    changes.push( { code: 'AAA2', oldPrice: 200, newPrice: 300 } );
    changes.push( { code: 'AAA3', oldPrice: 300, newPrice: 100 } );
    changes.push( { code: 'AAA4', oldPrice: 400, newPrice: 500 } );

    for(var i=0; i<changes.length && i<10; i++) {
        fireSingleNotification(changes[i]);
    }
}

function fireSingleNotification(change) {
    chrome.notifications.create(
        'priceChangedNotification' + change.id,
        {
            type: 'basic',
            iconUrl: change.imgSrc,
            title: change.title,
            message: change.message,
            isClickable: true,
            requireInteraction: true
        }, function callback(createdId) {

            // Событие оповещения для Google analytics
            //gaNotificationCreateCallback();

            var handler = function(id) {
                if(id == createdId) {
                    chrome.tabs.create({ url: change.url });
                    chrome.notifications.clear(id);
                    chrome.notifications.onClicked.removeListener(handler);

                    // Событие перехода по оповещению для Google analytics
                    //gaNotificationOpenUrlCallback();
                }
            };
            chrome.notifications.onClicked.addListener(handler);
        });
}

function downloadProductUpdates(productUpdateList){
    return new Promise(function(resolve, reject) {
        if(isEmpty(productUpdateList)) {
            resolve([]);
        }

        var params = [];
        for(var i=0; i<productUpdateList.length; i++) {
            params.push({
                index: i,
                product: productUpdateList[i]
            });
        }

        Promise.all(params.map(loadProduct)).then(
            function(results) {
                resolve(results);
            }
        );
    });
}

function loadProduct(params) {
    return new Promise(function(resolve, reject) {
        sleep(params.index * 2000);
        $.get(params.product.url, function(response) {
            resolve( { code: params.product.code, price: parsePrice(response, params.product.code) } );
        })
        .fail(function() {
            resolve( { code: params.product.code, price: -1 } );
        });
    });
}

function parsePrice(response, productCode) {
    var page =  $( (' ' + response).slice(1) );
    var productDivSearchStr = 'div.ii-product[data-sku="' + productCode + '"]';
    return $(page).find(productDivSearchStr).find('div.ii-product__price').attr('data-current');
}

// Хз что
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