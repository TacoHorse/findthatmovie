'use strict'

function displayAutocompleteOptions(returnObject) { // Inserts auto-complete options into the DOM
    $('.js-autocomplete-select').empty();
    for (let i = 0; i < returnObject.titles.length; i++) {
        let node = document.createElement("option");
        let val = document.createTextNode(returnObject.titles[i]);
        node.appendChild(val)
        document.getElementById("js-autocomplete-select").appendChild(node);
    }

}

function displaySingleMovieResults(inputObject) { // Display the search results for a single movie item
    displaySingleMovieInfo(inputObject);
    $(".js-search-results").off().on("movieDataDone", function (event) {
        displayYouTubeTrailer();
    });

}

function displayYouTubeTrailer() { // Display an appropriate trailer
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
                    let formatBudget = "$" + reviewResponse[0].budget.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
                    let output = `
            <div class="single-movie-results js-single-movie-results">
                <h2>${movieTitle}</h2>
                <h3>${reviewResponse[0].tagline}</h3>
                <div class="youtube-trailer-container js-youtube-trailer-container"></div>
                <div class="single-movie-budglength"><p class="budget-para">${formatBudget}</p><p class="budget-para"> <img class="runtime-icon js-runtime-icon" src="images/runtimeicon.png" alt="runtime">${reviewResponse[0].runtime} mins</p></div>
                    <div class="single-movie-info js-single-movie-info">
                        <div class="single-movie-text js-single-movie-text">
                            <img class="movie-poster js-movie-poster" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${responseObject[0].poster}">
                                <p class="single-movie-description">${responseObject[0].description}</p>
                                <div class="cast-list js-cast-list">`;
                    for (let i = 0; i < reviewResponse[0].cast.length; i++) {
                        output += `
                                        <img src="https://image.tmdb.org/t/p/w500/${reviewResponse[0].cast[i].url}">
                                        <p>${reviewResponse[0].cast[i].actor}</p>
                                        <p>${reviewResponse[0].cast[i].character}</p>
                                    `
                    };
                    output += `
                                </div>
                                        <div class="review-header"><h2>Reviews</h2></div> <div class="placeholder"></div>
                                            <div class="review-container js-review-container">
                                                <div class="tmdb-reviews js-tmdb-reviews">`;

                    if (reviewResponse[0].reviews.length > 0) {
                        for (let i = 0; i < reviewResponse[0].reviews.length; i++) {
                            output += `
                                                            <div class="tmdb-review-${i} tmdb-review-item">
                                                                <h3>Review by: ${reviewResponse[0].reviews[i].author}</h3>`;

                            let parts = splitTmdbReviews(reviewResponse[0].reviews[i].content);
                            output += `<p>${parts[0]}<button class="collapse-toggle-btn" onclick="handleCollapse(${i})">...Read more</button></p>
                                                                <div class="tmdb-hidden js-hidden js-tmdb-review-hidden-${i}">${parts[1]}</div>
                                                                <a href="${reviewResponse[0].reviews[i].url}">View on TMDB.org</a>
                                                            </div>`;
                        }
                    } else {
                        output += `<div class="tmdb-review-0">
                                                            <h3>No reviews to display</h3>
                                                        </div>`;
                    }

                    output += `</div>
                                                    <div class="youtube-reviews js-youtube-reviews">         
                                                    </div>
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

function displayYouTubeReviews(movieTitle, vidLength, nextPageToken) { // Display youtube review videos
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
                observerForYouTubeReviews(); // Observer for async content fill
            });
        });

}

function displayMovieList(responseData) { // Insert a list of movie titles into the DOM
    function handleMovieItemCount(currentSearchPage, i) {
        return i + 1 + (19 * currentSearchPage);
    }
    if ($('.js-search-results-grid').length <= 0) {
        let output = `<div class="search-results-grid js-search-results-grid">`;
        for (let i = 0; i < responseData[0].results.length; i++) {
            let intersect;
            if (i === 15) {
                intersect = `movie-list-end-${userData.asyncTrigCount}`
            } else intersect = '';
            output += `<div class="multi-movie-result-item js-multi-movie-result-item ${intersect}" id="movie-item-${handleMovieItemCount(userData.currentSearchPage, i)}">
                        <div class="user-rating-container js-user-rating-container">
                            <div class="user-rating js-user-rating js-multi-click" name="${responseData[0].results[i].title}"><p class="inner-user-rating js-inner-user-rating"></p></div>
                            <img class="movie-poster-search js-movie-poster-search" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${responseData[0].results[i].poster_path}">
                        </div>
                    </div>`;
        }
        output += `</div>`;
        $(".js-search-results").append(output);
        let childNodes = document.getElementsByClassName('js-multi-movie-result-item');
        
        for (let i = 0; i < childNodes.length; i++) {
            Promise.all([getMovieInfoByName(childNodes[i].children[0].firstElementChild.getAttribute('name'))])
                .then(returnObject => {
                    childNodes[i].children[0].firstElementChild.children[0].innerText = returnObject[0].rating + "/10";
                });
        }
        if (responseData[0].results.length >= 15) {
            observerForResults();
        }
    } else {
        let output = ``;
        for (let i = 0; i < responseData[0].results.length; i++) {
            let intersect;
            if (i === 15) {
                intersect = `movie-list-end-${userData.asyncTrigCount}`
            } else intersect = '';
            output += `<div class="multi-movie-result-item js-multi-movie-result-item ${intersect}" id="movie-item-${handleMovieItemCount(userData.currentSearchPage, i)}">
                        <div class="user-rating-container js-user-rating-container">
                            <div class="user-rating js-user-rating js-multi-click" name="${responseData[0].results[i].title}"><p class="inner-user-rating js-inner-user-rating"></p></div>
                            <img class="movie-poster-search js-movie-poster-search" src="https://image.tmdb.org/t/p/w600_and_h900_bestv2${responseData[0].results[i].poster_path}">
                        </div>
                    </div>`;
        }
        $(".js-search-results-grid").append(output);
        let childNodes = document.getElementsByClassName('js-multi-movie-result-item');

        for (let i = 0; i < childNodes.length; i++) {
            Promise.all([getMovieInfoByName(childNodes[i].children[0].firstElementChild.getAttribute('name'))])
                .then(returnObject => {
                    childNodes[i].children[0].firstElementChild.children[0].innerText = returnObject[0].rating + "/10";
                });
        }
        if (responseData[0].results.length >= 15) {
            observerForResults();
        }
    }
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
                    <label class="custom-list year-custom-list" for="user-year">
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
                    <label class="custom-list genre-custom-list" for="user-genre">
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
                            <span class="autoplay-off"><div class="autoplay-button js-autoplay-button">Autoplay &#9746</div></span>
                            <span class="autoplay-on"><div class="autoplay-button js-autoplay-button">Autoplay &#9745</div></span>
                        </label>
                        
                    </div>
                </div>
    `

    $(`.${formName}`).append(output);
}