'use strict'

async function getMovieInfoByName(name) { // Searches for movie information by name
    const baseURL = "https://api.themoviedb.org/3/search/movie?";
    let queryString = encodeQueryParams(buildMovieQueryParams(name, undefined, undefined));
    let requestURL = baseURL + queryString;

    let requestData = await fetch(requestURL) // Fetch data
        .then(response => handleErrors(response)) // Check data
        .then(responseJSON => {
            return responseJSON
        })
        .catch(e => alert(e));

    let returnObject = { // Build returnObject
        name: name,
        id: requestData.results[0].id,
        description: requestData.results[0].overview,
        orig_release: requestData.results[0].release_date,
        poster: requestData.results[0].poster_path
    }

    return returnObject;
}

async function getDetailedMovieInfo(id) { // Get more detailed information about the specified movie, needs ID passed from getMovieInfoByName()
    const baseURLInfo = "https://api.themoviedb.org/3/movie/";
    let queryString = encodeQueryParams(buildDetailedMovieParams());
    let requestURLInfo = baseURLInfo + id + "?" + queryString;
    let requestURLReview = baseURLInfo + id + "/reviews?" + queryString;

    let requestDataInfo = await fetch(requestURLInfo)
        .then(response => handleErrors(response))
        .then(responseJSON => {
            return responseJSON;
        })
        .catch(e => alert(e));

    let requestDataReview = await fetch(requestURLReview)
        .then(response => handleErrors(response))
        .then(responseJSON => {
            return responseJSON;
        })
        .catch(e => alert(e));

    let returnObject = {
        budget: requestDataInfo.budget,
        tagline: requestDataInfo.tagline,
        runtime: requestDataInfo.runtime,
        backdrop_path: requestDataInfo.backdrop_path,
        reviews: []
    };

    requestDataReview.results.forEach((item, index) => {
        let obj = {
            author: item.author,
            content: item.content,
            url: item.url
        }
        returnObject.reviews.push(obj);
    });

    return returnObject;

}

async function getKeywordId(keyword) { // Get the id for keyword entered
    const baseURL = "https://api.themoviedb.org/3/search/keyword?";
    let queryString = encodeQueryParams(buildKeywordParams(keyword));
    let requestURL = baseURL + queryString;

    let requestData = await fetch(requestURL)
    .then(response => handleErrors(response))
    .then(responseJSON => {
        return responseJSON;
    })
    .catch(e => alert(e));
    return requestData;
}

async function getMovieList(genre, year = getYear(), newPage = false, keyword) { // Get a list of movies by year or by genre, or by both; if no year is entered default to current year
    const baseURL = "https://api.themoviedb.org/3/discover/movie?";
    let queryString = "";
    // currentSearchPage is used to keep a client-side record of what page - if any, they are on for search results //
    //  While these results will be displayed by AJAX on page scroll, the JSON resposne is paginated                //
    if (newPage === false) { // If newPage is false, then ensure the global page count variable is 0, and then begin GET request.  
        userData.currentSearchPage = 1;
    } else { // If newPage is true, then incremenet the global page count variable by 1 and fetch new data.
        userData.currentSearchPage++;
    }
    if (keyword) {
        queryString = encodeQueryParams(buildMovieQueryParams(undefined, undefined, undefined, userData.currentSearchPage, keyword));
        
    } else {
        if (genre != undefined) { // If the user selects a genre, search for it
            queryString = encodeQueryParams(buildMovieQueryParams(undefined, year, genre, userData.currentSearchPage));
        } else { // Otherwise just search by year only
            queryString = encodeQueryParams(buildMovieQueryParams(undefined, year, undefined, userData.currentSearchPage));
        }
    }
    let requestURL = baseURL + queryString;
    console.log(requestURL);
    let requestData = await fetch(requestURL) // Fetch data
        .then(response => handleErrors(response)) // Check data
        .then(responseJSON => {
            return responseJSON // return JSON
        })
        .catch(e => alert(e));

    return requestData;
}

async function getYouTubeVideos(searchQuery, vidLength, resultsPage) { // Search for youtube-trailers by movie name and year
    const baseURL = "https://www.googleapis.com/youtube/v3/search?"
    let queryString = encodeQueryParams(buildYouTubeQueryParams(searchQuery, vidLength, resultsPage));
    let requestURL = baseURL + queryString;

    let requestData = await fetch(requestURL) // Fetch data
        .then(response => handleErrors(response)) // Check data
        .then(responseJSON => {
            return responseJSON // return JSON
        })
        .catch(e => alert(e));

    userData.youtube.pageTokenVid = requestData.nextPageToken;

    let returnObject = { // build returnObject
        urls: [],
        snippets: []
    }

    for (let i = 0; i < requestData.items.length; i++) {
        returnObject.urls[i] = requestData.items[i].id.videoId;
        returnObject.snippets[i] = requestData.items[i].snippet;
    }

    return returnObject;
}

async function getYouTubeVideoInfo(videoIDs, findPart) { // Gets info for the specified videos
    const baseURL = "https://www.googleapis.com/youtube/v3/videos?";
    let queryString = encodeQueryParams(buildYouTubeVideoQueryParams(videoIDs, findPart));
    let requestURL = baseURL + queryString;

    let requestData = await fetch(requestURL) // Fetch data
        .then(response => handleErrors(response)) // Check data
        .then(responseJSON => {
            return responseJSON;
        })
        .catch(e => alert(e));

    return requestData;
}

async function getAutocompleteMovieList(input, finder = false) { // Gets a complete list of all movies for use with autocomplete
    const baseURL = "https://api.themoviedb.org/3/search/movie?";
    let queryString = encodeQueryParams(buildAutocompleteParams(input));
    let requestURL = baseURL + queryString;

    let requestData = await fetch(requestURL) // Fetch data
        .then(response => handleErrors(response)) // Check data
        .then(responseJSON => {
            return responseJSON; // return JSON
        })
        .catch(e => alert(e));

    let returnObject = { // Build returnObject
        titles: []
    };

    for (let i = 0; i < requestData.results.length; i++) {
        returnObject.titles[i] = requestData.results[i].title;
    }
    if (finder === false) {
        displayAutocompleteOptions(returnObject);
    } else {
        return returnObject;
    }
}