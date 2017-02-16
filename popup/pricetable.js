;
$(function() {
    applyEmbeddedSettings();

    chrome.browserAction.setBadgeText({text:""});

    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
    ga('create', window.settings.GA.ID, 'auto');
    ga('create', window.settings.GA.ID, 'lamoda.ru', window.settings.GA.tracker, {
        transport: 'beacon'
    });
    ga(window.settings.GA.tracker + '.set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
    ga(window.settings.GA.tracker + '.require', 'displayfeatures');

    getProductTable(renderCallback);
});

var renderCallback = function(productTable) {
    if(productTable.length == 0) {
        $.get('emptyPriceTable.html', function(result) {
            $('#mainTableBody').html(result);
        });
    }
    else {
        $.get('priceTableItem.html', function(result) {
            renderProductTable(productTable, result);
        });
    }
};

var renderProductTable = function(productTable, itemTemplate) {

    $('#mainTableBody').empty();
    for(var i=0; i<productTable.length; i++) {
        var url = productTable[i].url + productTable[i].utm;

        var itemHtml =  $( (' ' + itemTemplate).slice(1) );
        //var tdPriceOld = itemHtml.find('.productPriceOld')[0];
        var tdPriceNew = itemHtml.find('.productPriceNew')[0];
        var tdPriceStart = itemHtml.find('.productPriceStart')[0];
        var labelName = itemHtml.find('label.productName')[0];
        var aLink = itemHtml.find('.productLink')[0];
        var aLink2 = itemHtml.find('.productLink')[1];
        var productImg = itemHtml.find('img.product')[0];
        var removeButton = itemHtml.find('button.removeProduct')[0];
        var rowId = itemHtml.find('.data-id')[0];
        var priceElementTableBody = itemHtml.find('.priceTableElementBody')[0];
        var priceRow = itemHtml.find('tr.clickable-row')[0];

        $(rowId).val(productTable[i].code);
        $(labelName).text(productTable[i].name);
        $(aLink).attr('data-url', url);
        $(aLink2).attr('data-url', url);
        $(productImg).attr('src', productTable[i].imgBase64);

        var utm = productTable[i].utm;
        var oldPrice = productTable[i].oldPrice;
        var newPrice = productTable[i].newPrice;
        var startPrice = isEmpty(productTable[i].startPrice) ? 0 : productTable[i].startPrice;

        if(oldPrice == null) {
            if(newPrice != null) {
                $(tdPriceNew).text("Текущая: " + newPrice + " руб.");
            }
            else {
                $(tdPriceNew).text("Товар отсутствует");
            }
        }
        else if(newPrice == null) {
            //var lastPriceText = 'Последняя цена - ' + oldPrice + ' руб.';
            //$(tdPriceOld).text("Товар отсутствует.\n" + lastPriceText);
            $(tdPriceNew).text("Товар отсутствует");
        }
        else {
            $(tdPriceNew).text("Текущая: " + newPrice + " руб.");
        }

        $(tdPriceStart).text('Начальная:' + startPrice + " руб.");

        applyEmbeddedSettings();

        //if(window.settings.testApp === true) {
            var timeTable =
                '<tr><td><table width="100%"><tbody><tr><td class="productTimeOld" width="50%" style="font-size: 10px;"> Last: ' + formatDate( new Date(Date.parse(productTable[i].lastUpdateTime))) +
                '</td><td class="productTimeNew" width="50%" style="font-size: 10px;"> Next: ' + formatDate( new Date(Date.parse(productTable[i].nextUpdateTime))) +
                '</td></tr></tbody></table></td></tr>';

                $(priceElementTableBody).append(timeTable);
        //}

        $(removeButton).attr("data-id", productTable[i].code);
        $(removeButton).attr("id", productTable[i].code);
        $(priceRow).attr('data-url', productTable[i].url);

        $('#mainTableBody').append(itemHtml);
    }

    var removeButtons = $('button.removeProduct');
    for(var j=0; j<removeButtons.length; j++) {
        $(removeButtons[j]).click(function(e) {
            e.preventDefault();
            var productCode = $(this).attr('data-id');
            removeProduct(productCode, renderCallback);
        });
    }

    var clickableRows = $('tr.clickable-row');
    for(var k=0; k<clickableRows.length; k++) {
        $(clickableRows[k]).click(function(e) {
            e.preventDefault();
            var url = $(this).attr('data-url');
            ga(window.settings.GA.tracker + '.send', 'event', window.settings.GA.actions.tableProductClick, url );
            window.open(url + utm, '_blank');
            window.focus();
        });
    }

    var clickableLinks = $('a.productLink');
    for(var m=0; m<clickableLinks.length; m++) {
        $(clickableLinks[m]).click(function(e) {
            e.preventDefault();
            var url = $(this).attr('data-url');
            ga(window.settings.GA.tracker + '.send', 'event', window.settings.GA.actions.tableProductClick, url );
            window.open(url + utm, '_blank');
            window.focus();
        });
    }
};

var formatDate = function (date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getDate() + "." + monthNames[date.getMonth()] + "." + date.getFullYear() + "  " + strTime;
};

var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
