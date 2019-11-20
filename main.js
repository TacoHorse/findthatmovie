'use strict'

function initSite() { // Initializes the site
    displaySeach("js-search-form");
    getUserInput();
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

async function getMovieInfoByName(name) {
    let baseURL = "https://api.themoviedb.org/3/search/movie?";
    let queryString = encodeQueryParams(buildMovieQueryParams(name));
    let requestURL = baseURL + queryString;

    let requestData = await fetch(requestURL)
        .then(response => handleErrors(response))
        .then(responseJSON => {
            return responseJSON
        })
        .catch(e => alert(e));

    let returnObject = {
        name: name,
        id: requestData.results[0].id,
        description: requestData.results[0].overview,
        orig_release: requestData.results[0].release_date,
        poster: requestData.results[0].poster_path
    }

    return returnObject;
}

async function getYouTubeTrailer(movieTitle) {
    let baseURL = "https://www.googleapis.com/youtube/v3/search?"
    let queryString = encodeQueryParams(buildYouTubeQueryParams(movieTitle + " trailer"));
    let requestURL = baseURL + queryString;

    let requestData = await fetch(requestURL)
        .then(response => handleErrors(response))
        .then(responseJSON => {
            return responseJSON
        })
        .catch(e => alert(e));

    let returnObject = {
        url: requestData.items[0].id.videoId
    }

    return returnObject;
}

function buildYouTubeQueryParams(movieTitle) {
    let params = {
        key: "AIzaSyDDvSrO4-9C87TaVW3jodmB3UhiXhA66W0",
        part: "snippet",
        q: movieTitle
    }
    return params;
}

function buildMovieQueryParams(name, year) { // If this function is invoked without any parameters, it can be used for when the user searches genre to get the api_key and language parameters, genre search is determined by /genre/movie/list endpoint not query string
    let params = {
        api_key: "7658594a35b754254b048a6ac98e566d",
        language: "en-US"
    }

    if (name) {
        params.query = name;
        params.include_adult = false;
    }

    if (year) {
        params.year = year;
    }

    return params;
}

function getUserInput() {
    $('.js-search-form').submit(e => {
        e.preventDefault();
        let inputObject = {};
        inputObject.name = $("input[name=user-search]").val();

        displaySingleMovieResults(inputObject);
    });
}

function displaySingleMovieResults(inputObject) {

    //     <iframe class="youtube-videos js-youtube-videos" id="movie-trailer" width="640" height="360" name="movie-trailer" src="https://www.youtube.com/embed/${responseObject[1].url}">
    
    Promise.all([getMovieInfoByName(inputObject.name), getYouTubeTrailer(inputObject.name)])
        .then(responseObject => {
            let output = `
    <div class="single-movie-results js-single-movie-results">
        <h2>${responseObject[0].name + " (" + responseObject[0].orig_release.substring(0, 4) + ")"}</h2>
        <iframe class="youtube-video js-youtube-video" src="//www.youtube.com/embed/${responseObject[1].url}" frameborder="0" allowfullscreen></iframe>

        <div class="single-movie-info js-single-movie-info">
            <img class="movie-poster js-movie-poster" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2/${responseObject[0].poster}">
            <p>${responseObject[0].description}</p>
        </div>
    </div>
    `;

            $(".js-search-results").empty();
            $(".js-search-results").append(output);
        });


}

function displaySeach(formName) {
    let output = `
    <input type="text" name="user-search" id="user-search" class="user-search js-user-search" placeholder="Enter a movie">
    
    <div class="select-container js-select-container">
    <select multiple name="user-year" id="user-year" class="user-year js-user-year">
            <option value="0000">Year(s)</option>
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

        <select multiple name="user-genre" id="user-genre" class="user-genre js-user-genre">
            <option value="00">Genre(s)</option>
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