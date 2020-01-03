'use strict'
var userData = { // Store important userData for the duration of their session
    currentSearchPage: 1,
    autoCheck: Boolean,
    genre: '',
    year: '',
    asyncTrigCount: 0,
    autoplay: false,
    youtube: {
        asyncTrig: 0,
        pageTokenVid: 0,
        query: ''
    }
};

function handleErrors(response) { // prepares error message for HTTP request errors
    if (response.ok === true) {
        return response.json();
    } else {
        throw new Error("Code " + response.status + " Message: " + response.statusText)
    }
}

function getYear() { // Gets the current year whenever necessary
    return new Date().getFullYear();
}

function convertISOTime(timeCode) { // Converts ISO time codes to more typical format

    function addZero(time) {
        let zeroTime = 0
        if (time < 10) {
            return zeroTime + time;
        } else return time
    }

    let hourIndex, minuteIndex, secondIndex = 0;
    let time = '';

    if (timeCode.includes("H")) {
        hourIndex = timeCode.indexOf("H");
        let h = timeCode.slice(0, hourIndex).replace(/\D/g, '');
        h = addZero(h);
        time += h + ':';
    }

    if (timeCode.includes("M")) {
        minuteIndex = timeCode.indexOf("M");
        let m = timeCode.slice(hourIndex, minuteIndex).replace(/\D/g, '');
        m = addZero(m);
        time += m + ':';
    }

    if (timeCode.includes("S")) {
        secondIndex = timeCode.indexOf("S");
        let s = timeCode.slice(minuteIndex, secondIndex).replace(/\D/g, '');
        s = addZero(s);
        time += s;
    }

    return time;
}

function splitTmdbReviews(contentObject) { // Splits TMDB reviews into preview and full body segments
    let parts = [];
    parts[0] = contentObject.slice(0, 250);
    parts[1] = contentObject.slice(250, contentObject.length);

    return parts;
}

function encodeQueryParams(params) { // Formats a given params object in the 'key=value&key=value' format
    const queryItems = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function createUserInputObject(inputObject) {
    inputObject.name = $("input[name=user-search]").val();
    inputObject.genre = $(".js-user-genre").val();
    inputObject.year = $(".js-user-year").val();
}

function setDefaultUserSearchData() {
    userData.currentSearchPage = 0;
    userData.genre = '';
    userData.year = '';
    userData.genre = $(".js-user-genre").val();
    userData.year = $(".js-user-year").val();
}

function checkPoster(object) {
    let url;
    if (object != null) {
        url = "https://image.tmdb.org/t/p/w600_and_h900_bestv2" + object;
    } else {
        url = "images/not-found.jpg";
    }

    return url;
}