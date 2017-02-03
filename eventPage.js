;

//--- Загрузка настроек расширения
    window.settings = {};
    applySettings();

//--- Запуск периодической фоновой задачи (выполняется каждую минуту)
    addAlarm();

//--- Слушатель запуска фоновой задачи
//    chrome.alarms.onAlarm.addListener(onAlarmListener);

//--- Слушатель входящих сообщений (с сайта: добавить товар)
    chrome.runtime.onMessage.addListener(onMessageListener);

    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-91379404-02', 'auto');
    ga('create', 'UA-91379404-02', 'lamoda.ru', 'myTracker', {
        transport: 'beacon'
    });
    ga('myTracker.set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
    ga('myTracker.require', 'displayfeatures');
    //ga('myTracker.send', 'event', 'link', 'click', '/option/options.html');

function applySettings() {
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
            // ga('myTracker.send', 'event', 'link', 'click', '/option/options.html');

            var handler = function(id) {
                if(id == createdId) {
                    chrome.tabs.create({ url: change.url });
                    chrome.notifications.clear(id);
                    chrome.notifications.onClicked.removeListener(handler);

                    // Событие перехода по оповещению для Google analytics
                    // ga('myTracker.send', 'event', 'link', 'click', '/option/options.html');
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
            if(response.status == 200) {
                resolve( { code: params.product.code, price: parsePrice(response, params.product.code) } );
            }
            else if(response.status == 404) {
                resolve( { code: params.product.code, price: false } );
            }
            else {
                resolve( { code: params.product.code, price: -1 } );
            }
        })
        .fail(function(response) {
            if(response.status == 404) {
                resolve( { code: params.product.code, price: false } );
            }
            else {
                resolve( { code: params.product.code, price: -1 } );
            }
        });
    });
}

//===== PRODUCTION =====
// function parsePrice(response, productCode) {
//     var page =  $( (' ' + response).slice(1) );
//     var productDivSearchStr = 'div.ii-product[data-sku="' + productCode + '"]';
//     return $(page).find(productDivSearchStr).find('div.ii-product__price').attr('data-current');
// }
//===== PRODUCTION =====

//===== TEST =====
function parsePrice(response, productCode) {
    var page =  $( (' ' + response).slice(1) );
    var productDivSearchStr = 'td.productPrice';
    return $(page).find(productDivSearchStr).attr('data-current');
}
//===== TEST =====

// Хз что
// function lockUpdate() {
//     var updateObj = chrome.storage.local.get('priceChecker_updateObject', function() {});
//     if(typeof updateObj == 'undefined' || updateObj == null) {
//         updateObj = {
//             lastTime: new Date().getTime(),
//             lock: true
//         };
//     }
//     else {
//         var nowTime = new Date().getTime();
//         if(nowTime - updateObj.lastTime < 60000 || updateObj.lock == true) {
//             return false;
//         }
//     }
//
//     chrome.storage.local.set( {'priceChecker_updateObject':  updateObj });
//     return true;
// }
//
// function unlockUpdate() {
//     var updateObj = {
//         lastTime: new Date().getTime(),
//         lock: false
//     };
//     chrome.storage.local.set( {'priceChecker_updateObject':  updateObj });
// }


// var changes = [];
//
// var change = {
//     id: 1,
//     imgSrc: 'img/logo.png',
//     title: 'HI',
//     message: 'Oh, yeah!',
//     url: 'http://www.ya.ru'
// };
// changes.push(change);
//
// change = {
//     id: 2,
//     imgSrc: 'img/logo.png',
//     title: 'HI',
//     message: 'Oh, yeah!',
//     url: 'http://www.ya.ru'
// };
// changes.push(change);
//
// change = {
//     id: 3,
//     imgSrc: 'img/logo.png',
//     title: 'HI',
//     message: 'Oh, yeah!',
//     url: 'http://www.ya.ru'
// };
// changes.push(change);
//
// change = {
//     id: 4,
//     imgSrc: 'img/logo.png',
//     title: 'HI',
//     message: 'Oh, yeah!',
//     url: 'http://www.ya.ru'
// };
// changes.push(change);