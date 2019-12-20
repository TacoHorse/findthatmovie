# Findthatmovie

Access the site here: https://seancowan-dev.github.io/findthatmovie/

This application allows users to search for a movie and retrieve trailers, reviews, tweets, and full cast and synopsis information in one place.  Findthatmovie was developed for the Bloc/Thinkful Web Developer API Hack Capstone.  The purpose of this application is to demonstrate my knowledge of RESTful APIs and their implementation in a meaningful way.  It is also intended to show a client-side only implementation.  

### Why This App Was Made

We've all gone through the same process when trying to find a new movie to either go see at a theatre, or stream at home.  You know the one; where you go to IMDB or some similar site, looks for new titles, then you go to youtube and watch some trailers, then you try to find reviews of the movie on Reddit.  Finally after all that you decide that particular movie isn't for you and you go back to the list and start the whole process over again.

This app is to solve this process.  Instead of doing all that you can open this app in one tab, get a list of movies by year or genre, pick one and immediately see movie information, trailers, reviews, tweets and (in a future feature release) the ability to find showtimes and streaming locations where applicable.

### What the heck is an API Hack capstone?

This is terminology used by Bloc/Thinkful to denote a sizeable in-curriculum project which focuses on the use of RESTful APIs and their implementation with jQuery and asynchronous JavaScript.  This is a precursor to the curriculum on using React.js to develop dynamic web applications.  The 'Hack' component of API Hack is refering to building composite information based on multiple API endpoints to provide coherent and useful information to the user.

# Changelog

### Version 1.0

Barebones unstyled version for testing purposes.  Twitter API features were initially planned for this version but were not implemented because the Twitter API requires server-side authentication.

### Version 1.1

This is the current version.  This version provides: Trailers, Movie Cast and Synopsis, and YouTube reviews for a movie of the user's choosing.  The user can find movies in one of the following ways:

1. By entering the movie title directly
2. By selecting a particular genre and choosing from a list
3. By selecting a particular year and choosing from a list

## Planned Features

### Version 1.2

Add Twitter feed for searched movies.  This requires server side authentication and as such was outside the scope of the project for version 1.1

### Version 1.3

1. If the movie is new (now playing) they will see showtimes for the nearest theater to their location
2.  If the movie is old (not playing in theatres) then they will see places on the web where it can be streamed
3.  Google map for theatre

