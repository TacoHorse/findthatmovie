'use strict'

var currentSearchPage = 1; // TheMovieDB API stores results in pages, this global variable will keep track of what page the user is on

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
        currentSearchPage = 1;
    } else { // If newPage is true, then incremenet the global page count variable by 1 and fetch new data.
        currentSearchPage++;
    }

    if (genre != undefined) { // If the user selects a genre, search for it
        queryString = encodeQueryParams(buildMovieQueryParams(undefined, year, genre, currentSearchPage));
    } else { // Otherwise just search by year only
        queryString = encodeQueryParams(buildMovieQueryParams(undefined, year, undefined, currentSearchPage));
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

async function getYouTubeTrailer(movieTitle) { // Search for youtube-trailers by movie name and year
    const baseURL = "https://www.googleapis.com/youtube/v3/search?"
    let queryString = encodeQueryParams(buildYouTubeQueryParams(movieTitle + " trailer"));
    let requestURL = baseURL + queryString;

    let requestData = await fetch(requestURL) // Fetch data
        .then(response => handleErrors(response)) // Check data
        .then(responseJSON => {
            return responseJSON // return JSON
        })
        .catch(e => alert(e));

    let returnObject = { // build returnObject
        url: requestData.items[0].id.videoId
    }

    return returnObject;
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

function buildAutocompleteParams(typed) { // Prepare the parameters for Autocomplete queries to TMDB API
    let params = {
        api_key: "7658594a35b754254b048a6ac98e566d",
        query: typed
    }
    return params;
}

function buildYouTubeQueryParams(movieTitle) { // Prepare the parameters for the queries to the YouTube API for trailers
    let params = {
        key: "AIzaSyDDvSrO4-9C87TaVW3jodmB3UhiXhA66W0",
        part: "snippet",
        q: movieTitle,
        type: "video",
        videoDuration: "short" // Ensure short duration videos only so that trailers, and not trailer compilations are found
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
    $('.js-search-results').empty();
    let inputObject = {}; // Build user data object
    inputObject.name = $("input[name=user-search]").val();
    inputObject.genre = $(".js-user-genre").val();
    inputObject.year = $(".js-user-year").val();
    $("input[name=user-search]").val('');

    if (inputObject.name != '') { // If the user has entered a text query then search for that title, otherwise...
        displaySingleMovieResults(inputObject);
    } else {
        if (inputObject.name === '') {
            if (inputObject.year != '0000' && inputObject.genre != '00') { // If the user has entered both year and genre then perform the search
                Promise.all([getMovieByGenreOrYear(inputObject.genre, inputObject.year)])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }
            if (inputObject.genre != '00' && inputObject.year === '0000') { // Search by genre
                Promise.all([getMovieByGenreOrYear(inputObject.genre)])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }

            if (inputObject.year != '0000' && inputObject.genre === '00') { // Search by year
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

function watchUserInput() { // Set up required event listeners for the application
    listenerForSubmitButton();
    listenerForAutocomplete();
    listenerForAutocompleteSelection();
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
    Promise.all([getYouTubeTrailer(title)])
        .then(returnObject => {
            $(".js-youtube-trailer-container").append(`<iframe width="360px" height="202.5px" class="youtube-video js-youtube-video" src="https://www.youtube.com/embed/${returnObject[0].url}" frameborder="0" allowfullscreen></iframe>`);
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
                <img class="movie-poster js-movie-poster" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${responseObject[0].poster}">
                <div class="single-movie-text js-single-movie-text">
                <p>${responseObject[0].description}</p>
                </div>
            </div>
        </div>
        `;
            $(".js-search-results").append(output);
            $(".js-search-results").trigger("movieDataDone");
        });
}

function displayMovieList(responseData) { // Insert a list of movie titles into the DOM
    let output = `<div class="search-results-grid js-search-results-grid">`;
    for (let i = 0; i < responseData[0].results.length; i++) {
        output += `<div class="multi-movie-result-item js-multi-movie-result-item">
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