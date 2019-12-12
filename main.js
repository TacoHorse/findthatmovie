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
        if (userData.autoCheck === true) { // If the user has entered a query matching a movie title exactly
            displaySingleMovieResults(inputObject);
        } else { // Otherwise search by keyword and display results
        Promise.all([getKeywordId(inputObject.name)])
            .then(keywordResponse => {
                Promise.all([getMovieList(undefined, undefined, false, keywordResponse[0].results[0].id)])  //TMDB doesn't support multi-keyword search so take the first one
                    .then(responseData => {
                        if (responseData[0].results.length > 0) {
                            displayMovieList(responseData);
                        } else console.log("nothing found");
                    });
            });

        }
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

// function convertKeywords(requestData) {
//     let keywordString = '';
//     console.log(requestData[0].results);
//     for (let i = 0; i < requestData[0].results.length; i++) {
//         keywordString+= requestData[0].results[i].id + `,`;
//     }
//     return keywordString.slice(0, -1);
// }
$(initSite);