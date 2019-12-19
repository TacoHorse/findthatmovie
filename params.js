'use strict'

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

function buildYouTubeVideoQueryParams(videoIDs, findPart) { // Prepare the query information for finding YouTube videos

    // findPart must be one of the following valid YouTube parts: contentDetails, fileDetails, id, liveStreamingDetails, localizations
    // player, processingDetails, recordingDetails, snippet, statistic, status, suggestions, or topicDetails

    let params = {
        key: "AIzaSyDDvSrO4-9C87TaVW3jodmB3UhiXhA66W0",
        part: findPart,
        id: videoIDs,
        maxResults: 10,
    }

    return params;
}

function buildMovieQueryParams(name, year, genre, page, keyword) { // Prepare the parameters for TMDB API queries other than Autocomplete
    let params = {
        api_key: "7658594a35b754254b048a6ac98e566d",
        language: "en-US"
    }

    if (name != undefined) { // If the user has entered a movie by title
        params.query = name;
        params.include_adult = false;
    } else { // If no title then check for year or genre selections
        if (year != undefined) {
            params.primary_release_year = year;
        }

        if (genre != undefined) {
            params.with_genres = genre;
        }
    }

    if (page > 0) { // If a specific query page is requested
        params.page = page;
    }

    if (keyword) { // If a keyword search is performed
        params.with_keywords = keyword;
    }

    return params;
}

function buildDetailedMovieParams() { // Prepare params for detailed movie information queries
    let params = {
        api_key: "7658594a35b754254b048a6ac98e566d",
        language: "en-US"
    }

    return params;
}

function buildKeywordParams(keyword) { // Prepare params for keyword lookup
    let params = {
        api_key: "7658594a35b754254b048a6ac98e566d",
        language: "en-US",
        query: keyword
    }

    return params;
}