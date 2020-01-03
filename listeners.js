'use strict'

function listenerForAutocompleteSelection() { // Watches for when the user selects an autocomplete option
    $('.js-search-form').on('change', 'input', e => {
        if (Array.from(e.target.classList).find(elem => elem === 'youtube-trailer-autoplay') != "youtube-trailer-autoplay") {
            getAutocompleteMovieList($('.js-user-search').val(), true).then(autoCompleteObj => {
                let arr = Array.from(autoCompleteObj.titles)
                let compare = $('.js-user-search').val();
                let map = arr.map(item => {
                    if (item.toLowerCase() === compare.toLowerCase()) {
                        return true;
                    } else {
                        return false;
                    }
                });
                if (map.includes(true)) {
                    handleSubmitButton();
                }
            });
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

function listenerForClick() { // Watches for when the user clicks on a movie in the list of movies
    $('.js-search-results').on("click", e => {
        let arr = Object.values(e.target.classList);

        if (arr.some(elem => elem === "js-multi-click")) {
            let inputObject = {};
            inputObject.name = e.target.attributes.name.value;
            $('.js-search-results').empty();
            displaySingleMovieResults(inputObject);
            listenerForClick();
        }
    });
}

function observerForResults() { // Watches for when new movie results need to be added to the page
    let observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting === true) {
                    userData.asyncTrigCount++;
                    observer.unobserve(document.querySelector(`.movie-list-end-${userData.asyncTrigCount - 1}`));

                    if (userData.year != '0000' && userData.genre != '00') { // If the user has entered both year and genre then perform the search
                        Promise.all([getMovieList(userData.genre, userData.year, true)])
                            .then(responseData => {
                                displayMovieList(responseData);

                            });
                    }
                    if (userData.genre != '00' && userData.year === '0000') { // Search by genre
                        Promise.all([getMovieList(userData.genre, undefined, true)])
                            .then(responseData => {
                                displayMovieList(responseData);

                            });
                    }

                    if (userData.year != '0000' && userData.genre === '00') { // Search by year
                        Promise.all([getMovieList(undefined, userData.year, true)])
                            .then(responseData => {
                                displayMovieList(responseData);

                            });
                    }
                    if (userData.year === '0000' && userData.genre === '00') {
                        Promise.all([getMovieList(undefined, undefined, true)])
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

function observerForYouTubeReviews() { // Watches for when new youtube reviews need to be added to the page
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