;
$( function() {

    if(window.settings.testApp == true) {
        var allLinks = $('div.testDiv a');
        for( var i=0; i< allLinks.length; i++) {
            $(allLinks[i]).attr('href', window.settings.pathToTestProducts + $(allLinks[i]).attr('href'));
        }
        $('div.testDiv').show();
     }

    $('#save').click(function(e) {
        save_options();
    });

    // Если меняем единицы в которах хранится пороговое значение срабатывания изменения цены,
    // то надо пересоздать слайдеры, чтобы правильно отображалась шкала и значения
    $('input[name="changeThresholdUnit"]').click(function(e) {

        var currVal = $('#changePriceThreshold').slider('value');
        var maxValue = 1;

        var id = e.target.id;
        if(id == 'changeThresholdUnitRub') {
            $('#priceThreshUnitHidden').val('rouble');
            maxValue = 999;
        }
        if(id == 'changeThresholdUnitPercent') {
            $('#priceThreshUnitHidden').val('percent');
            maxValue = 100;
        }

        var handle = $( "#custom-handle" );
        $( "#changePriceThreshold" ).slider(
            {
                create: function() {
                    currVal = currVal > maxValue ? maxValue : currVal;
                    $(this).slider('value', currVal );
                    handle.text( currVal );
                },
                slide: function( event, ui ) {
                    handle.text( ui.value );
                },
                min: 1,
                max: maxValue
            }
        );
    });

    restore_options();


} );

// Saves options to chrome.storage
function save_options() {
    var priceThresholdUnit = ($('#changeThresholdUnitRub').prop('checked') == true)
                                                ? 'rouble'
                                                : ($('#changeThresholdUnitPercent').prop('checked') == true)
                                                        ? 'percent'
                                                        : 'rouble';

    var trackIfMissing = ( $('#trackIfMissingTrue').prop('checked') == true)
                                                ? true
                                                : ($('#trackIfMissingFalse').prop('checked') != true);

    var settings = {
        updateInterval: Number( $('#updateInterval').val() ),
        changeThresholdUnitRub: priceThresholdUnit == 'rouble' ? $( "#changePriceThreshold" ).slider("value") : 100,
        changeThresholdUnitPercent: priceThresholdUnit == 'percent' ? $( "#changePriceThreshold" ).slider("value") : 4,
        changeThresholdUnit: priceThresholdUnit,
        missingAfterDays: $('#missingAfterDays').val(),
        trackIfMissing: trackIfMissing,
        missingCheckPeriod: 7,
        missingCheckTimes: $('#missingCheckTimes').val(),
        maxPriceToShow: $('#maxPriceToShow').val(),
        maxProductCount: 60,
        maxProductCountUpdatePerTime: 5,
        maxNotificationCount: 10
    };
    chrome.storage.sync.set( settings , function() {});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get(
        {
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
        },
        function(items) {
            var priceThresholdUnit = items.changeThresholdUnit;
            var priceThresholdVal = (priceThresholdUnit == 'rouble'
                                                ? items.changeThresholdUnitRub
                                                : priceThresholdUnit == 'percent'
                                                        ? items.changeThresholdUnitPercent
                                                        : 0);

            $('#updateInterval').val(items.updateInterval);
            $('#changeThresholdUnitRub').prop('checked', priceThresholdUnit == 'rouble');
            $('#changeThresholdUnitPercent').prop('checked', priceThresholdUnit == 'percent');
            $("#priceThreshHidden").val(priceThresholdVal);
            $("#priceThreshUnitHidden").val(priceThresholdUnit);
            $('#missingAfterDays').val(items.missingAfterDays);
            $('#trackIfMissingTrue').prop('checked', items.trackIfMissing);
            $('#trackIfMissingFalse').prop('checked', !items.trackIfMissing);
            $('#missingCheckTimes').val(items.missingCheckTimes);
            $('#maxPriceToShow').val(items.maxPriceToShow);

            var handle = $( "#custom-handle" );
            var maxValue = $('#priceThreshUnitHidden').val() == 'rouble' ? 999 : $('#priceThreshUnitHidden').val() == 'percent' ? 100 : 1;

            // При загрузке значений из хранилища, корректное пересоздание слайдеров
            // чтобы правильно отображалась шкала и значения
            $( "#changePriceThreshold" ).slider(
                {
                    create: function() {
                        $(this).slider('value', priceThresholdVal );
                        handle.text( $( this ).slider( "value" ) );
                    },
                    slide: function( event, ui ) {
                        handle.text( ui.value );
                    },
                    min: 1,
                    max: maxValue
                }
            );
        }
    );
}
