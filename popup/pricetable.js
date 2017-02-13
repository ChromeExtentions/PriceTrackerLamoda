;
$(function() {
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
        var tdPriceOld = itemHtml.find('.productPriceOld')[0];
        var tdPriceNew = itemHtml.find('.productPriceNew')[0];
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
        $(aLink).attr('href', url);
        $(aLink2).attr('href', url);
        $(productImg).attr('src', productTable[i].imgBase64);

        var oldPrice = productTable[i].oldPrice;
        var newPrice = productTable[i].newPrice;

        if(oldPrice == null) {
            if(newPrice != null) {
                $(tdPriceNew).text(" " + newPrice + " руб.");
            }
            else {
                $(tdPriceOld).text("Товар отсутствует");
            }
        }
        else if(newPrice == null) {
            var lastPriceText = 'Последняя цена - ' + oldPrice + ' руб.';
            $(tdPriceOld).text("Товар отсутствует.\n" + lastPriceText);
        }
        else {
            $(tdPriceOld).text("Было " + oldPrice + " руб.");
            $(tdPriceNew).text("Стало " + newPrice + " руб.");
        }

        applyEmbeddedSettings();
        if(window.settings.testApp === true) {
            var timeTable =
                '<tr><td><table width="100%"><tbody><tr><td class="productTimeOld" width="50%" style="font-size: 10px;"> Last: ' + formatDate( new Date(Date.parse(productTable[i].lastUpdateTime))) +
                '</td><td class="productTimeNew" width="50%" style="font-size: 10px;"> Next: ' + formatDate( new Date(Date.parse(productTable[i].nextUpdateTime))) +
                '</td></tr></tbody></table></td></tr>';

                $(priceElementTableBody).append(timeTable);
        }

        $(removeButton).attr("data-id", productTable[i].code);
        $(priceRow).attr('data-url', productTable[i].url);

        $('#mainTableBody').append(itemHtml);

        $('button.removeProduct').click(function(e) {
            e.preventDefault();
            var productCode = $(this).attr('data-id');
            removeProduct(productCode, renderCallback);
        });

        $('tr.clickable-row').click(function(e) {
            e.preventDefault();
            var url = $(this).attr('data-url');
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
    return date.getDate()+1 + "." + monthNames[date.getMonth()] + "." + date.getFullYear() + "  " + strTime;
};

var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
