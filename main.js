'use strict'

function initSite() { // Initializes the site
    displaySearch("js-search-form");
    handleAutoplayCookie();
    watchUserInput();
}

function handleAutoplay() { // Sets the internal autoplay variable for the app to use
    userData.autoplay = $('.js-youtube-trailer-autoplay').is(':checked'); // Set autoplay property for embded trailer
    if (userData.autoplay === true) {
        document.cookie = `autoplay=${userData.autoplay};`;
    } else {
        document.cookie = `autoplay=false`;
    }
}

function handleAutoplayCookie() { // Stores cookie for the autoplay setting for the user's next visit
    if (document.cookie.split(';').filter((item) => item.startsWith('autoplay=true')).length) {
        userData.autoplay = true; // Set autoplay property for embded trailer
        $('.js-youtube-trailer-autoplay').prop("checked", true);
    } else {
        userData.autoplay = false; // Set autoplay property for embded trailer
        $('.js-youtube-trailer-autoplay').prop("checked", false);
    }
}

function handleCollapse(itemNumber) { // Handles the expanding review items for TMDB reviews
    let newText = $(`.js-tmdb-review-hidden-${itemNumber}`).text(); // Get the hidden text
    let oldText = $(`.tmdb-review-${itemNumber} > p`).text(); // Get the already visible text
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
    setDefaultUserSearchData();
    let inputObject = {}; // Build user data object
    createUserInputObject(inputObject);

    handleSubmitLogic(inputObject);
    $("input[name=user-search]").replace(`<input type="text" name="user-search" id="user-search" list="js-autocomplete-data" class="user-search js-user-search" placeholder="Enter a movie">`);
}

function handleSubmitLogic(inputObject) {
    console.log(inputObject);
    if (inputObject.name != '') { // If the user has entered a text query then search for that title, otherwise...
        getAutocompleteMovieList(inputObject.name, true).then(autoCompletObj => {
            let arr = Array.from(autoCompletObj.titles)
            let compare = inputObject.name;
            let map = arr.map(item => {
                if (item.toLowerCase() === compare.toLowerCase()) {
                    return true;
                } else {
                    return false;
                }
            });
            if (map.includes(true)) {
                displaySingleMovieResults(inputObject);
            } else { 
                // Otherwise search by keyword and display results
                console.log("ran");
                Promise.all([getKeywordId(inputObject.name)])
                    .then(keywordResponse => {
                        if (keywordResponse[0].results.length > 0) {
                            Promise.all([getMovieList(undefined, undefined, false, keywordResponse[0].results[0].id)]) //TMDB doesn't support multi-keyword search so take the first one
                            .then(responseData => {
                                if (responseData[0].results.length > 0) {
                                    displayMovieList(responseData);
                                } else $('.js-search-results').append(`<p>No results with that keyword could be found.  Please refine your search.</p>`);
                            });
                        } else $('.js-search-results').append(`<p>That is not a valid keyword on TMDB, please try a different search.</p>`);
                    });
            }
        });
    } else {
        if (inputObject.name === '') {
            if (inputObject.year != '0000' && inputObject.genre != '00') { // If the user has entered both year and genre then perform the search
                userData.currentSearchYear = inputObject.year;
                userData.currentSearchGenre = inputObject.genre;
                Promise.all([getMovieList(inputObject.genre, inputObject.year)])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }
            if (inputObject.genre != '00' && inputObject.year === '0000') { // Search by genre
                userData.currentSearchGenre = inputObject.genre;
                Promise.all([getMovieList(inputObject.genre)])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }

            if (inputObject.year != '0000' && inputObject.genre === '00') { // Search by year
                userData.currentSearchYear = inputObject.year;
                Promise.all([getMovieList(undefined, inputObject.year)])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }
            if (inputObject.year === '0000' && inputObject.genre === '00') {
                Promise.all([getMovieList()])
                    .then(responseData => {
                        displayMovieList(responseData);

                    });
            }
        }
    }
}
$(initSite);