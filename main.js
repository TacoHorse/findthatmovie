'use strict'

var userData = { // Store important userData for the duration of their session
    currentSearchPage: 1,
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

function initSite() { // Initializes the site
    displaySearch("js-search-form");
    handleAutoplayCookie();
    watchUserInput();
}

function encodeQueryParams(params) { // Formats a given params object in the 'key=value&key=value' format
    const queryItems = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function encodeTwitterKeys(key, secret) {
    const query = encodeURIComponent(key) + ":" + encodeURIComponent(secret);
    return query;
}

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

async function getDetailedMovieInfo(id) {  // Get more detailed information about the specified movie, needs ID passed from getMovieInfoByName()
    const baseURLInfo = "https://api.themoviedb.org/3/movie/";
    let queryString = encodeQueryParams(buildDetailedMovieParams());
    let requestURLInfo = baseURLInfo + id + "?" + queryString;
    let requestURLReview = baseURLInfo + id + "/reviews?" + queryString;

    let requestDataInfo = await fetch(requestURLInfo)
    .then (response => handleErrors(response))
    .then(responseJSON => {
        return responseJSON;
    })
    .catch(e => alert(e));

    let requestDataReview = await fetch(requestURLReview)
    .then (response => handleErrors(response))
    .then(responseJSON => {
        return responseJSON;
    })
    .catch(e => alert(e));

    let returnObject = {
        budget: requestDataInfo.budget,
        tagline: requestDataInfo.tagline,
        runtime: requestDataInfo.runtime,
        backdrop_path: requestDataInfo.backdrop_path,
        reviews: [
        ]
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

async function getMovieByGenreOrYear(genre, year = getYear(), newPage = false) { // Get a list of movies by year or by genre, or by both; if no year is entered default to current year
    const baseURL = "https://api.themoviedb.org/3/discover/movie?";
    let queryString = "";
    // currentSearchPage is used to keep a client-side record of what page - if any, they are on for search results //
    //  While these results will be displayed by AJAX on page scroll, the JSON resposne is paginated                //
    if (newPage === false) { // If newPage is false, then ensure the global page count variable is 0, and then begin GET request.  
        userData.currentSearchPage = 1;
    } else { // If newPage is true, then incremenet the global page count variable by 1 and fetch new data.
        userData.currentSearchPage++;
    }

    if (genre != undefined) { // If the user selects a genre, search for it
        queryString = encodeQueryParams(buildMovieQueryParams(undefined, year, genre, userData.currentSearchPage));
    } else { // Otherwise just search by year only
        queryString = encodeQueryParams(buildMovieQueryParams(undefined, year, undefined, userData.currentSearchPage));
    }

    let requestURL = baseURL + queryString;

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

async function getYouTubeVideoInfo(videoIDs, findPart) {
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

async function getAutocompleteMovieList(input) { // Gets a complete list of all movies for use with autocomplete
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

    displayAutocompleteOptions(returnObject);
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

function buildAutocompleteParams(typed) { // Prepare the parameters for Autocomplete queries to TMDB API
    let params = {
        api_key: "7658594a35b754254b048a6ac98e566d",
        query: typed
    }
    return params;
}

function buildYouTubeQueryParams(searchQuery, vidLength, nextPageToken) { // Prepare the parameters for the queries to the YouTube API; if getting multiple results pass nextPageToken
    let params = {
        key: "AIzaSyDDvSrO4-9C87TaVW3jodmB3UhiXhA66W0",
        part: "snippet",
        maxResults: 10,
        q: searchQuery,
        type: "video",
        videoDuration: vidLength // must be either "short" "medium" or "long"
    }

    if (nextPageToken) {
        params.pageToken = nextPageToken;
    }
    return params;
}

function buildYouTubeVideoQueryParams(videoIDs, findPart) {

    // findPart must be on of the following valid YouTube parts: contentDetails, fileDetails, id, liveStreamingDetails, localizations
    // player, processingDetails, recordingDetails, snippet, statistic, status, suggestions, or topicDetails

    let params = {
        key: "AIzaSyDDvSrO4-9C87TaVW3jodmB3UhiXhA66W0",
        part: findPart,
        id: videoIDs,
        maxResults: 10,
    }

    return params;
}

function buildMovieQueryParams(name, year, genre, page) { // Prepare the parameters for TMDB API queries other than Autocomplete
    let params = {
        api_key: "7658594a35b754254b048a6ac98e566d",
        language: "en-US"
    }

    if (name != undefined) { // If the user has entered a movie by title
        params.query = name;
        params.include_adult = false;
    } else { // If no title then check for year or genre selections
        params.page = page;
        if (year != undefined) {
            params.primary_release_year = year;
        }

        if (genre != undefined) {
            params.with_genres = genre;
        }
    }

    if (page) { // If a specific query page is requested
        params.page = page;
    }

    return params;
}

function buildDetailedMovieParams() {
    let params = {
        api_key: "7658594a35b754254b048a6ac98e566d",
        language: "en-US"
    }

    return params;
}

function handleErrors(response) { // prepares error message for HTTP request errors
    if (response.ok === true) {
        return response.json();
    } else {
        throw new Error("Code " + response.status + " Message: " + response.statusText)
    }
}

function handleAutoplay() {
    userData.autoplay = $('.js-youtube-trailer-autoplay').is(':checked'); // Set autoplay property for embded trailer
    if (userData.autoplay === true) {
    document.cookie = `autoplay=${userData.autoplay};`;
    } else {
    document.cookie = `autoplay=false`;
    }
}

function handleAutoplayCookie() {
    if (document.cookie.split(';').filter((item) => item.startsWith('autoplay=true')).length) {
        userData.autoplay = true; // Set autoplay property for embded trailer
        $('.js-youtube-trailer-autoplay').prop("checked", true);
    } else {        
        userData.autoplay = false; // Set autoplay property for embded trailer
        $('.js-youtube-trailer-autoplay').prop("checked", false);
    }
}

function handleCollapse(itemNumber) {
    let newText = $(`.js-tmdb-review-hidden-${itemNumber}`).text(); // Get the hidden text
    let oldText = $(`.tmdb-review-${itemNumber} > p`).text();  // Get the already visible text
    let trimmed = oldText.slice(0, oldText.length - 12); // Trim ...Read more from existing text

    let fullText = trimmed + newText; // Build complete review text
    $(`.tmdb-review-${itemNumber} > p > button`).addClass("tmdb-hidden"); // Hide the button
    
    $(`.tmdb-review-${itemNumber} > p`).text(fullText); // Insert full review text into DOM and let CSS transition handle the rest
}

function handleSubmitButton() { // Actions to perform when user hits submit button, also called when user selects an autocomplete option

    if (userData.currentSearchPage > 1) { // If the user has had infinite scroll results added during previous search bring them back to top of page
        window.scrollTo(0, 0);
    }
    $('.js-search-results').empty();
    userData.currentSearchPage = 1;
    userData.genre = '';
    userData.year = '';

    let inputObject = {}; // Build user data object
    inputObject.name = $("input[name=user-search]").val();
    inputObject.genre = $(".js-user-genre").val();
    userData.genre = $(".js-user-genre").val();
    inputObject.year = $(".js-user-year").val();
    userData.year = $(".js-user-year").val();
    $("input[name=user-search]").val('');

    if (inputObject.name != '') { // If the user has entered a text query then search for that title, otherwise...
        displaySingleMovieResults(inputObject);
    } else {
        if (inputObject.name === '') {
            if (inputObject.year != '0000' && inputObject.genre != '00') { // If the user has entered both year and genre then perform the search
                userData.currentSearchYear = inputObject.year;
                userData.currentSearchGenre = inputObject.genre;
                Promise.all([getMovieByGenreOrYear(inputObject.genre, inputObject.year)])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }
            if (inputObject.genre != '00' && inputObject.year === '0000') { // Search by genre
                userData.currentSearchGenre = inputObject.genre;
                Promise.all([getMovieByGenreOrYear(inputObject.genre)])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }

            if (inputObject.year != '0000' && inputObject.genre === '00') { // Search by year
                userData.currentSearchYear = inputObject.year;
                Promise.all([getMovieByGenreOrYear(undefined, inputObject.year)])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }
            if (inputObject.year === '0000' && inputObject.genre === '00') {
                Promise.all([getMovieByGenreOrYear()])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }
        }
    }
}

function listenerForAutocompleteSelection() { // Watches for when the user selects an autocomplete option
    $(document).on('change', 'input', e => {
        if (e.target.className === 'user-search js-user-search') {
            handleSubmitButton();
        }
    });
}

function listenerForSubmitButton() { // Watches for when the user presses the submit button
    $('.js-search-form').on("submit", e => {
        e.preventDefault();
        handleSubmitButton();
    });
}

function listenerForAutocomplete() { // Watches for what the user types in the search field
    $("#user-search").on("keyup", e => {

        let userInput = $('.js-user-search').val();

        if (e.key != undefined) {
            if (e.key.length === 1) {
                getAutocompleteMovieList(userInput);
            }
        }

    });
}

function listenerForClick() {
    $('.js-search-results').on("click", e=> {
        $('.js-search-results').empty();
        console.log(e);
        let arr = Object.values(e.target.classList);
        if (arr.some(elem => elem === "js-multi-click")) {
            let inputObject = {};
            inputObject.name = e.target.name;
            displaySingleMovieResults(inputObject);
        }
    });
}

function observerForResults() {
    let observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting === true) {
                    userData.asyncTrigCount++;
                    observer.unobserve(document.querySelector(`.movie-list-end-${userData.asyncTrigCount - 1}`));

                    if (userData.year != '0000' && userData.genre != '00') { // If the user has entered both year and genre then perform the search
                        Promise.all([getMovieByGenreOrYear(userData.genre, userData.year, userData.currentSearchPage)])
                            .then(responseData => {
                                displayMovieList(responseData);

                            });
                    }
                    if (userData.genre != '00' && userData.year === '0000') { // Search by genre
                        Promise.all([getMovieByGenreOrYear(userData.genre, undefined, userData.currentSearchPage)])
                            .then(responseData => {
                                displayMovieList(responseData);

                            });
                    }

                    if (userData.year != '0000' && userData.genre === '00') { // Search by year
                        Promise.all([getMovieByGenreOrYear(undefined, userData.year, userData.currentSearchPage)])
                            .then(responseData => {
                                displayMovieList(responseData);

                            });
                    }
                    if (userData.year === '0000' && userData.genre === '00') {
                        Promise.all([getMovieByGenreOrYear(undefined, undefined, userData.currentSearchPage)])
                            .then(responseData => {
                                displayMovieList(responseData);
                            });
                    }
                }
            });
        }, {
            root: document.window,
            rootMargin: "0px"
        }
    );

    observer.observe(document.querySelector(`.movie-list-end-${userData.asyncTrigCount}`));
}

function observerForYouTubeReviews() {
    let observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting === true) {
                    observer.unobserve(document.querySelector(`.js-youtube-async-${userData.youtube.asyncTrig}`)); // Remove old observer
                    userData.youtube.asyncTrig++; // Increment the async page count
                    displayYouTubeReviews(userData.youtube.query, "medium", userData.youtube.pageTokenVid); // Get more results
                }
            });
        }, {
            root: document.querySelector(`.js-youtube-reviews`),
            rootMargin: "0px"
        });

    observer.observe(document.querySelector(`.js-youtube-async-${userData.youtube.asyncTrig}`));
}



function watchUserInput() { // Set up required event listeners for the application
    listenerForSubmitButton();
    listenerForAutocomplete();
    listenerForAutocompleteSelection();
    listenerForClick();
}


function displayAutocompleteOptions(returnObject) { // Inserts auto-complete options into the DOM
    $('.js-autocomplete-select').empty();
    for (let i = 0; i < returnObject.titles.length; i++) {
        let node = document.createElement("option");
        let val = document.createTextNode(returnObject.titles[i]);
        node.appendChild(val)
        document.getElementById("js-autocomplete-select").appendChild(node);
    }

}

function displaySingleMovieResults(inputObject) {
    displaySingleMovieInfo(inputObject);
    $(".js-search-results").off().on("movieDataDone", function (event) {
        displayYouTubeTrailer();
    });

}

function displayYouTubeTrailer() {
    let movTitle = $(".js-search-results").children();
    let title = movTitle.prevObject[0].childNodes[1].childNodes[1].innerText;

    Promise.all([getYouTubeVideos(title + " trailer", "short")])
       .then(returnObject => {
        let output = `<iframe width="1280px" height="720px" class="youtube-video js-youtube-video" src="https://www.youtube.com/embed/${returnObject[0].urls[0]}`;

        if (userData.autoplay === true) {
            output += `?mute=1&autoplay=1" frameborder="0" allowfullscreen></iframe>`;
        } else {
            output += `" frameborder="0" allowfullscreen></iframe>`;
        }
           $(".js-youtube-trailer-container").append(output);
       });
}

function displaySingleMovieInfo(inputObject) { // Displays the movie information prior to finding YouTube trailer, so that the youtube trailer GET request can use the full movie name with year from the DOM
    userData.youtube.asyncTrig = 1; // Reset the async counter for youtube reviews
    Promise.all([getMovieInfoByName(inputObject.name)]) // Perform the API query to get movie info
        .then(responseObject => {
            Promise.all([getDetailedMovieInfo(responseObject[0].id)])
            .then(reviewResponse => {
                let movieTitle = responseObject[0].name + " (" + responseObject[0].orig_release.substring(0, 4) + ")";
            let output = `
            <div class="single-movie-results js-single-movie-results">
                <h2>${movieTitle}</h2>
                <h3>${reviewResponse[0].tagline}</h3>
                <div class="youtube-trailer-container js-youtube-trailer-container"></div>
                <div class="single-movie-info js-single-movie-info">
                    <div class="single-movie-text js-single-movie-text">
                        <div class="single-movie-budglength"><img class="movie-poster js-movie-poster" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${responseObject[0].poster}"><p>Budget: ${reviewResponse[0].budget}</p><p>Duration: ${reviewResponse[0].runtime} mins</p></div>
                            <p class="single-movie-description">${responseObject[0].description}</p>
                            <div class="review-header"><h2>Reviews</h2></div><div class="placeholder"></div>
                            <div class="tmdb-reviews js-tmdb-reviews">`;

                        if (reviewResponse[0].reviews.length > 0) {
                            for (let i = 0; i < reviewResponse[0].reviews.length; i++) {
                                output += `
                                <div class="tmdb-review-${i} tmdb-review-item">
                                    <h3>Review by: ${reviewResponse[0].reviews[i].author}</h3>`;

                                    let parts = splitTmdbReviews(reviewResponse[0].reviews[i].content);
                                output +=    `<p>${parts[0]}<button class="collapse-toggle-btn" onclick="handleCollapse(${i})">...Read more</button></p>
                                    <div class="tmdb-hidden js-hidden js-tmdb-review-hidden-${i}">${parts[1]}</div>
                                    <a href="${reviewResponse[0].reviews[i].url}">View on TMDB.org</a>
                                </div>`;
                            }
                        } else {
                            output += `<div class="tmdb-review-0">
                                <h3>No reviews to display</h3>
                            </div>`;
                        }
                    
                    output +=    `</div>
                        <div class="youtube-reviews js-youtube-reviews">         
                        </div>
                    </div>
                </div>
            </div>
            `;
            $(".js-search-results").append(output); // Display results for a single movie.
            $(".js-search-results").trigger("movieDataDone"); //  Trigger custom event to know when search has occured
            userData.youtube.query = movieTitle; // Store the movie title for use in async youtube queries
            displayYouTubeReviews(movieTitle, "medium"); // Display the youtube reviews - calls another API query
            });
        });
}

function splitTmdbReviews(contentObject) {
    let parts = [];
    parts[0] = contentObject.slice(0, 250);
    parts[1] = contentObject.slice(250, contentObject.length);

    return parts;
}

function displayYouTubeReviews(movieTitle, vidLength, nextPageToken) {
    userData.youtube.query = movieTitle + " movie reviews";
    Promise.all([getYouTubeVideos(movieTitle + " movie reviews", vidLength, nextPageToken)]) // Perform the API query to get youtube review video IDs
        .then(responseObjectPrimary => {

            let videoIDs = '';
            responseObjectPrimary[0].urls.forEach(item => {
                videoIDs += item + ',';
            });

            videoIDs = videoIDs.substr(0, videoIDs.length - 1); // Build list of YouTube IDs
            Promise.all([getYouTubeVideoInfo(videoIDs, "contentDetails")]).then(responseObject => { // Perform the API query to get info on video IDs
                for (let i = 0; i < responseObjectPrimary[0].urls.length; i++) {
                    let intersect;
                    if (i === 6) {
                        intersect = `js-youtube-async-${userData.youtube.asyncTrig}`
                    } else intersect = '';
                    let output = `
                    <div class="youtube-review-item js-youtube-review-item ${intersect}">
                            <div class="youtube-review-thumbnail-duration-container js-youtube-review-thumbnail-duration-container"> 
                                <div class="youtube-review-thumbnail-container js-youtube-review-thumbnail-container">
                                    <a href="https://youtube.com/watch?v=${responseObjectPrimary[0].urls[i]}">
                                        <img src="${responseObjectPrimary[0].snippets[i].thumbnails.default.url}" class="youtube-review-thumbnails js-youtube-review-thumbnails">
                                    </a>
                                </div> 
                                <div class="youtube-review-thumbnail-duration js-youtube-review-thumbnail-duration">
                                    ${convertISOTime(responseObject[0].items[i].contentDetails.duration)}
                                </div>   
                            </div>
                            <div class="youtube-review-title-container js-youtube-review-title-container">
                            <a href="https://youtube.com/watch?v=${responseObjectPrimary[0].urls[i]}">
                                <h3>${responseObjectPrimary[0].snippets[i].title}</h3>
                            </a>
                                <p>${responseObjectPrimary[0].snippets[i].description}</p>
                            </div>
                    </div>`;
                    $('.js-youtube-reviews').append(output); // Insert a complete review object into the DOM
                }
                // observerForYouTubeReviews(); // Observer for async content fill
            });
        });
    
}

function displayMovieList(responseData) { // Insert a list of movie titles into the DOM
    function handleMovieItemCount(currentSearchPage, i) {
        if (currentSearchPage > 1) {
            return i + 1;
        } else return i;
    }

    let output = `<div class="search-results-grid js-search-results-grid">`;
    for (let i = 0; i < responseData[0].results.length; i++) {
        let intersect;
        if (i === 15) {
            intersect = `movie-list-end-${userData.asyncTrigCount}`
        } else intersect = '';
        output += `<div class="multi-movie-result-item js-multi-movie-result-item ${intersect}" id="movie-item-${handleMovieItemCount(userData.currentSearchPage, i)}">
        <a href="#top"><img class="movie-poster-search js-movie-poster-search js-multi-click" name="${responseData[0].results[i].title}" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${responseData[0].results[i].poster_path}"></a>
            <div class="movie-search-info js-movie-search-info"></a>
            <a href="#top"><h3 class="js-multi-click" name="${responseData[0].results[i].title}">${responseData[0].results[i].title}</h3>
                <p>${responseData[0].results[i].release_date}</p>
                <p>${responseData[0].results[i].overview}</p>
            </div>
        </div>`;
    }
    output += `</div>`;
    $(".js-search-results").append(output);
    observerForResults();
}

function displaySearch(formName) {
    
    let output = `<div class="select-container js-select-container">
                    <div class="user-search-container">
                    <input type="text" name="user-search" id="user-search" list="js-autocomplete-data" class="user-search js-user-search" placeholder="Enter a movie">
                    <input type="submit" name="user-submit" id="user-submit" class="submit-search js-submit-search grid-inputs">
                    <div class="search-inner-border"></div>
                    <datalist class="autocomplete-data js-autocomplete-data" id="js-autocomplete-data">

                        <select class="autocomplete-select js-autocomplete-select" id="js-autocomplete-select">
                        </select>

                    </datalist>
                 </div>
                <label class="custom-list" for="user-year">
                    <select name="user-year" id="user-year" class="user-year js-user-year grid-inputs">
                            <option value="0000">Year</option>
                            <option value="2020">2020</option>
                            <option value="2019">2019</option>
                            <option value="2018">2018</option>
                            <option value="2017">2017</option>
                            <option value="2016">2016</option>
                            <option value="2015">2015</option>
                            <option value="2014">2014</option>
                            <option value="2013">2013</option>
                            <option value="2012">2012</option>
                            <option value="2011">2011</option>
                            <option value="2010">2010</option>
                            <option value="2009">2009</option>
                            <option value="2008">2008</option>
                            <option value="2007">2007</option>
                            <option value="2006">2006</option>
                            <option value="2005">2005</option>
                            <option value="2004">2004</option>
                            <option value="2003">2003</option>
                            <option value="2002">2002</option>
                            <option value="2001">2001</option>
                            <option value="2000">2000</option>
                            <option value="1999">1999</option>
                            <option value="1998">1998</option>
                            <option value="1997">1997</option>
                            <option value="1996">1996</option>
                            <option value="1995">1995</option>
                            <option value="1994">1994</option>
                            <option value="1993">1993</option>
                            <option value="1992">1992</option>
                            <option value="1991">1991</option>
                            <option value="1990">1990</option>
                            <option value="1989">1989</option>
                            <option value="1988">1988</option>
                            <option value="1987">1987</option>
                            <option value="1986">1986</option>
                            <option value="1985">1985</option>
                            <option value="1984">1984</option>
                            <option value="1983">1983</option>
                            <option value="1982">1982</option>
                            <option value="1981">1981</option>
                            <option value="1980">1980</option>
                            <option value="1979">1979</option>
                            <option value="1978">1978</option>
                            <option value="1977">1977</option>
                            <option value="1976">1976</option>
                            <option value="1975">1975</option>
                            <option value="1974">1974</option>
                            <option value="1973">1973</option>
                            <option value="1972">1972</option>
                            <option value="1971">1971</option>
                            <option value="1970">1970</option>
                            <option value="1969">1969</option>
                            <option value="1968">1968</option>
                            <option value="1967">1967</option>
                            <option value="1966">1966</option>
                            <option value="1965">1965</option>
                            <option value="1964">1964</option>
                            <option value="1963">1963</option>
                            <option value="1962">1962</option>
                            <option value="1961">1961</option>
                            <option value="1960">1960</option>
                            <option value="1959">1959</option>
                            <option value="1958">1958</option>
                            <option value="1957">1957</option>
                            <option value="1956">1956</option>
                            <option value="1955">1955</option>
                            <option value="1954">1954</option>
                            <option value="1953">1953</option>
                            <option value="1952">1952</option>
                            <option value="1951">1951</option>
                            <option value="1950">1950</option>
                            <option value="1949">1949</option>
                            <option value="1948">1948</option>
                            <option value="1947">1947</option>
                            <option value="1946">1946</option>
                            <option value="1945">1945</option>
                            <option value="1944">1944</option>
                            <option value="1943">1943</option>
                            <option value="1942">1942</option>
                            <option value="1941">1941</option>
                            <option value="1940">1940</option>
                            <option value="1939">1939</option>
                            <option value="1938">1938</option>
                            <option value="1937">1937</option>
                            <option value="1936">1936</option>
                            <option value="1935">1935</option>
                            <option value="1934">1934</option>
                            <option value="1933">1933</option>
                            <option value="1932">1932</option>
                            <option value="1931">1931</option>
                            <option value="1930">1930</option>
                            <option value="1929">1929</option>
                            <option value="1928">1928</option>
                            <option value="1927">1927</option>
                            <option value="1926">1926</option>
                            <option value="1925">1925</option>
                            <option value="1924">1924</option>
                            <option value="1923">1923</option>
                            <option value="1922">1922</option>
                            <option value="1921">1921</option>
                            <option value="1920">1920</option>
                            <option value="1919">1919</option>
                            <option value="1918">1918</option>
                            <option value="1917">1917</option>
                            <option value="1916">1916</option>
                            <option value="1915">1915</option>
                            <option value="1914">1914</option>
                            <option value="1913">1913</option>
                            <option value="1912">1912</option>
                            <option value="1911">1911</option>
                            <option value="1910">1910</option>
                            <option value="1909">1909</option>
                            <option value="1908">1908</option>
                            <option value="1907">1907</option>
                            <option value="1906">1906</option>
                            <option value="1905">1905</option>
                        </select>
                    </label>
                    <label class="custom-list" for="user-genre">
                        <select name="user-genre" id="user-genre" class="user-genre js-user-genre grid-inputs">
                            <option value="00">Genre</option>
                            <option value="28">Action</option>
                            <option value="12">Adventure</option>
                            <option value="16">Animation</option>
                            <option value="35">Comedy</option>
                            <option value="80">Crime</option>
                            <option value="99">Documentary</option>
                            <option value="18">Drama</option>
                            <option value="10751">Family</option>
                            <option value="14">Fantasy</option>
                            <option value="36">History</option>
                            <option value="27">Horror</option>
                            <option value="10402">Music</option>
                            <option value="9648">Mystery</option>
                            <option value="10749">Romance</option>
                            <option value="878">Science Fiction</option>
                            <option value="10770">TV Movie</option>
                            <option value="53">Thriller</option>
                            <option value="10752">War</option>
                            <option value="37">Western</option>
                        </select>
                    </label>

                    <div class="autoplay-container">
                        <input name="youtube-trailer-autoplay" id="youtube-trailer-autoplay" class="js-youtube-trailer-autoplay youtube-trailer-autoplay grid-inputs" type="checkbox" onclick="handleAutoplay()"> 
                        <label for="youtube-trailer-autoplay" class="autoplay-off">
                            <span class="autoplay-off"><img src="images/autoplay-off.png"></span>
                            <span class="autoplay-on"><img src="images/autoplay-on.png"></span>
                        </label>
                        
                    </div>
                </div>
    `

    $(`.${formName}`).append(output);
}

$(initSite);