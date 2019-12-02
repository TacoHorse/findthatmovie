'use strict'

var userData = {
    currentSearchPage: 1, // TheMovieDB API stores results in pages, this global variable will keep track of what page the user is on
    genre: '',
    year: '',
    asyncTrigCount: 0
};

function initSite() { // Initializes the site
    displaySearch("js-search-form");
    watchUserInput();
}

function encodeQueryParams(params) { // Formats a given params object in the 'key=value&key=value' format
    const queryItems = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    return queryItems.join('&');
}

function handleErrors(response) { // prepares error message for HTTP request errors
    if (response.ok === true) {
        return response.json();
    } else {
        throw new Error("Code " + response.status + " Message: " + response.statusText)
    }
}

async function getMovieInfoByName(name) { // Searches for movie information by name
    const baseURL = "https://api.themoviedb.org/3/search/movie?";
    let queryString = encodeQueryParams(buildMovieQueryParams(name, undefined, undefined));
    let requestURL = baseURL + queryString;

    let requestData = await fetch(requestURL) // Fetch data
        .then(response => handleErrors(response)) // Check data
        .then(responseJSON => {
            return responseJSON // return JSON
        })
        .catch(e => alert(e));

    let returnObject = { // Build returnObject
        name: name,
        description: requestData.results[0].overview,
        orig_release: requestData.results[0].release_date,
        poster: requestData.results[0].poster_path
    }

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
            console.log(responseJSON);
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

function listenerForScroll() {
    $(document).on("scroll", e => {
        observerForResults();
    });
}

function observerForResults() {
    let observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting === true ) {
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
        },
        {root: document.window, rootMargin: "0px"}
    );

    observer.observe(document.querySelector(`.movie-list-end-${userData.asyncTrigCount}`));
}

function watchUserInput() { // Set up required event listeners for the application
    listenerForSubmitButton();
    listenerForAutocomplete();
    listenerForAutocompleteSelection();
    // listenerForScroll()
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
            $(".js-youtube-trailer-container").append(`<iframe width="1280px" height="720px" class="youtube-video js-youtube-video" src="https://www.youtube.com/embed/${returnObject[0].urls[0]}" frameborder="0" allowfullscreen></iframe>`);
        });
}

function displaySingleMovieInfo(inputObject) { // Displays the movie information prior to finding YouTube trailer, so that the youtube trailer GET request can use the full movie name with year from the DOM
    Promise.all([getMovieInfoByName(inputObject.name)])
        .then(responseObject => {
            let movieTitle = responseObject[0].name + " (" + responseObject[0].orig_release.substring(0, 4) + ")";
            let output = `
            <div class="single-movie-results js-single-movie-results">
                <h2>${movieTitle}</h2>
                <div class="youtube-trailer-container js-youtube-trailer-container"></div>
                <div class="single-movie-info js-single-movie-info">
                    <div class="single-movie-text js-single-movie-text">
                    <img class="movie-poster js-movie-poster" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${responseObject[0].poster}">
                    <p>${responseObject[0].description}</p>
                        <div class="youtube-reviews js-youtube-reviews">         
                        </div>
                    </div>
                </div>
            </div>
            `;
            $(".js-search-results").append(output);
            $(".js-search-results").trigger("movieDataDone");
            displayYouTubeReviews(movieTitle, "medium");
        });
}

function displayYouTubeReviews(movieTitle, vidLength) {
    Promise.all([getYouTubeVideos(movieTitle + "movie reviews", vidLength)])
        .then(responseObjectPrimary => {

            let videoIDs = '';
            responseObjectPrimary[0].urls.forEach(item => {
                videoIDs += item + ',';
            });
            videoIDs = videoIDs.substr(0, videoIDs.length - 1); // Build list of YouTube IDs
            Promise.all([getYouTubeVideoInfo(videoIDs, "contentDetails")]).then(responseObject => {
                for (let i = 0; i < responseObjectPrimary[0].urls.length; i++) {
                    let output = `
                    <div class="youtube-review-item js-youtube-review-item">
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
                    $('.js-youtube-reviews').append(output);
                }
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
        <img class="movie-poster-search js-movie-poster-search" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${responseData[0].results[i].poster_path}">
            <div class="movie-search-info js-movie-search-info">
                <h3>${responseData[0].results[i].title}</h3>
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
    0
    let output = `
    <input type="text" name="user-search" id="user-search" list="js-autocomplete-data" class="user-search js-user-search" placeholder="Enter a movie">

    <datalist class="autocomplete-data js-autocomplete-data" id="js-autocomplete-data">

        <select class="autocomplete-select js-autocomplete-select" id="js-autocomplete-select">
        </select>

    </datalist>

    <h3>Or search by...</h3>
    
    <div class="select-container js-select-container">
        <select name="user-year" id="user-year" class="user-year js-user-year">
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

            <select name="user-genre" id="user-genre" class="user-genre js-user-genre">
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
        </div>
        <input type="submit" name="user-submit" id="user-submit" class="submit-search js-submit-search">
    `

    $(`.${formName}`).append(output);
}

$(initSite);