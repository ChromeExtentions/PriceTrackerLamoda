;
function isEmpty(obj) {
    if(typeof obj == 'undefined' || obj == null) {
        return true;
    }

    if(Object.prototype.toString.call( obj ) === '[object Array]') {
        return obj.length <= 0;
    }

    if(Object.prototype.toString.call( obj ) === '[object Object]') {
        return obj.length <= 0;
    }

    return false;
};

function isDefined(obj) {
    return !(typeof obj == 'undefined' || obj == null);
};