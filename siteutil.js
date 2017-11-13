/*
    File: siteutil.js
    Author: Dilan Jenkins
    Project: RedditViewer
*/
//the name of the cookie to keep track of the list of favorite subreddits
var FAV_COOKIE_KEY = "listfave3";

//the key used for local storage to store favorite list
var FAV_STORE_KEY = "favelister";

//the default subreddit to search for,also updated to the last subreddit searched this session
var currentSubreddit = "";

//the number of times the progress bar has been incremented,used for smooth increase of progress
var progressUpdatedTimes = 0;

//whether the progress bar can be updated at the moment
var canUpdateProgress = true;

/*
    Sends AJAX request for a subreddit given by name
    Calls handleSubreddit function when response is received
    Updates currentSubreddit to the subredditName given
    Parameters:
        subredditName, string representing the subreddit to search for
        afterParam, optional string representing which posts to get. Used for pagination.
    Returns: Nothing
*/
function requestSubreddit( subredditName, afterParam )
{
    currentSubreddit = subredditName;
    var paramObj = { "limit" : 100 };
    if ( afterParam != undefined )
    {
        paramObj[ "after" ] = afterParam;
    }

    updateProgress();
    //escape any characters in the subreddit name so as to send in url
    var urlGet =  "https://www.reddit.com/r/" + encodeURIComponent( subredditName ) + "/new/.json" 
    $.get( urlGet, paramObj, handleSubreddit ).fail( failSearch );
}

function prependAlert( messageStr )
{
    var myAlert = $( "<div />" ).addClass( "alert" ).addClass( "alert-danger" ).text( messageStr );
    $( "#mainBodyDown" ).prepend( myAlert );
}

function failSearch()
{
    console.log( "Search failed" );
    prependAlert( "The search was not successful, please try again." );
    hideProgress();
}

// hides the progress bar
function hideProgress()
{
    $( "#waiting" ).css( "display" , "none" );
    setProgress( 0 );
}

// smoothly drives the progress up to max on the progress bar
// then calls hideProgress when progress is at max
function finishProgress()
{
    animateIncrementProgress( 100, hideProgress, 80 );
}

/*
    Sets the progress of the progress bar to the value given.
    Also stops the progress bar from being updated further until canUpdateProgress is set to true.
    Resets progressUpdatedTimes back to zero
    Parameters:
        val, integer value to set the progress bar to
    Return: Nothing
*/
function setProgress( val )
{
    progressUpdatedTimes = 0;
    canUpdateProgress = false;
    $( '#waiting .progress-bar' ).each( function()
    {
        $( this ).css( 'width', val + '%' ).attr( 'aria-valuenow', val ); 
        $( this ).text( val + "%" );
    }
    );
}

/*
    Animates the progress on the progress bar so that it has smoother increases.
    Parameters:
        maxValue, the value that the progress bar should go up to for this particular call
        onFinish, the function to be called when the maxValue is reached
        time, how fast the progress bar should be updated,integer in milliseconds
    Return: Nothing
*/
function animateIncrementProgress( maxValue, onFinish, time )
{
    if ( !canUpdateProgress )
    {
        return;
    }

    $( '#waiting .progress-bar' ).each( function()
    {
        var newVal = parseInt( $( this ).attr( 'aria-valuenow' ) ) + 1;
        if ( newVal <= maxValue )
        {
            $( this ).css( 'width', newVal + '%' ).attr( 'aria-valuenow', newVal ); 
            $( this ).css( "text-align" , "right" );
            $( this ).text( newVal + "%" );
            setTimeout( function() { animateIncrementProgress( maxValue, onFinish, time ) } , time );
        }
        else
        {
            onFinish();
        }
    }
    );
}

// updates the progress bar based on the progressUpdatedTimes variable
// will not update the progress bar if canUpdateProgress is false
// calls animateIncrementProgress function to animate the increase in progress
function updateProgress()
{
    if ( !canUpdateProgress )
    {
        return;
    }
    progressUpdatedTimes += 1;    
    var maxValue = progressUpdatedTimes * 5;
    animateIncrementProgress( maxValue, function() { }, 750 );
}

/*
    Starts a brand new search for a particular subreddit
    Parameters:
        subredditName, the name of the subreddit to search
        ignoreWaiting, whether this function should ignore the fact that the progress bar is shown(presumably a request is waited on)
        afterParam, the parameter to send to reddit to get paginated results
    Returns: Nothing
*/
function searchSubreddit( subredditName, ignoreWaiting, afterParam )
{
    // if the progress bar is being shown, then a search is currently being done so return(unless ignoreWaiting is true)
    if ( !ignoreWaiting && $( "#waiting" ).css( "display" ) != "none" )
    {
        return;
    }

    //set the progress bar down to zero,and show the progress bar(allowing for it to be updated ny setting canUpdateProgress to true)
    setProgress( 0 );
    canUpdateProgress = true;
    $( "#waiting" ).css( "display" , "flex" );
    //clear out any old results/text in the mainBody
    clearBody( "#mainBodyDown" );
    //send a request for the subreddit given
    requestSubreddit( subredditName, afterParam );
}

/*
    Clears the innerHTML of the DOM object given.
    Parameters:
        ofObj, the DOM object whose innerHTML should be cleared
    Returns: Nothing
*/
function clearBody( ofObj )
{
    $( ofObj ).html( "" );
}

/*
    Wrapper function for searching subreddit by clicking on a button
    Returns: Nothing
*/
function searchSubredditByClick()
{
    searchSubreddit( $( this ).text(), false );
}

/*
    Wrapper function for searching subreddit by using the redditSearch input box
    Returns: Nothing
*/
function searchSubredditByForm()
{
    searchSubreddit( $( "#redditSearch" ).val(), false );
}

/*
    Handler for when a link is right clicked
    Updates the style of the link
    Returns: Nothing
*/
function rightClickLink()
{
    $( this ).css( "color" , "black" );
    $( this ).css( "opacity" , "0.25" );
}

/*
    Convert the date to a unix timestamp and return said timestamp
    Parameters:
        dateStr, string representing the date to be converted
    Returns: unix timestamp in seconds since the unix epoch
*/
function convertDateToTime( dateStr )
{
    var dateObj = new Date( dateStr );
    //have to divide by 1000 because getTime returns milliseconds not seconds
    return Math.floor( dateObj.getTime() / 1000 );
}

/*
    Returns string of the current date formatted like so: M/D/YYYY
    ex: 5/16/2015
*/
function getFormatCurrentDate()
{
    var d = new Date();
    return ( d.getMonth() + 1 ) + "/" + d.getDate() + "/" + d.getFullYear();
}

/*
    Function called when a response is received from searching a subreddit
    Parameters:
        data, the response from the server. Assumed to be JSON object already
        status, the status string sent from the server. If not success then log the status and exit.
    Returns: Nothing
*/
function handleSubreddit( data, status )
{
    if ( status != "success" )
    {
        console.log( status );
        prependAlert( "Something went wrong." );
        setProgress( 0 );
        return;
    }

    // get the data needed out from the response and call outputSubreddit
    var responseObjAll = data;
    var responseObj = responseObjAll.data.children;
    updateProgress();
    outputSubreddit( responseObj,responseObjAll.data.after );
}

/*
    Adds the favStr to the list of favorites, both to the actual HTML/CSS on the page and to the model held in cookies.
    Parameters:
        favStr, name of a subreddit that is to be added to the list of favorites
    Returns: Nothing
*/
function addFavorite( favStr )
{
    var favList;

    //if localStorage is supported in this browser then use it,otherwise fallback to cookies
    if (typeof(Storage) !== "undefined") 
    {
        if ( localStorage.getItem( FAV_STORE_KEY ) == undefined )
        {
            localStorage.setItem( FAV_STORE_KEY , "[]" );
        }
        favList = JSON.parse( localStorage.getItem( FAV_STORE_KEY ) );
        favList.push( favStr.toLowerCase() );
        favList.sort();
        localStorage.setItem( FAV_STORE_KEY, JSON.stringify( favList ) );
    } 
    else 
    {
        // Sorry! No Web Storage support..
        favList = JSON.parse( Cookies.get( FAV_COOKIE_KEY ) )
        favList.push( favStr.toLowerCase() );
        favList.sort();
        Cookies.set( FAV_COOKIE_KEY , JSON.stringify( favList ) );
    }

    showFavorites();
}

//shows the favorite subreddits in a dropdown menu
function showFavorites()
{
    //remove all the old favorite buttons
    $( "button.redditSelect" ).remove();

    var favList;
    //if localStorage is supported in this browser then use it,otherwise fallback to cookies
    if ( typeof( Storage ) !== "undefined") 
    {
        //if the item in localStorage is undefined,create it and initialize to empty list
        if ( localStorage.getItem( FAV_STORE_KEY ) == undefined )
        {
            localStorage.setItem( FAV_STORE_KEY , "[]" );
        }

        favList = JSON.parse( localStorage.getItem( FAV_STORE_KEY ) );
    } 
    else 
    {
        // Sorry! No Web Storage support..
        //if the cookie is undefined,create it and initialize to empty list
        if ( Cookies.get(FAV_COOKIE_KEY) == undefined )
        {
            Cookies.set( FAV_COOKIE_KEY, "[]", { expires: 7 } );
        }

        favList = JSON.parse( Cookies.get( FAV_COOKIE_KEY ) );
    }

    //go through the list within the cookie,and add a button for each of the items
    for ( var favKey in favList )
    {
        var currentButton = $( "<button />" ).addClass( "dropdown-item" ).addClass( "redditSelect" ).attr( "type" , "button" );
        //using .text() function prevents XSS
        currentButton.text( favList[ favKey ] );
        $( "#favoriteList" ).append( currentButton );
    }
}

// event handler for the modal to add a favorite, calls addFavorite with the input value
// also closes the modal
function handleAddFavorite()
{
    addFavorite( $( "#favInput" ).val() );
    $( "#closeFavModal" ).click();
}

// setups the event handlers that are common between Quickview and Postview
function setupHandlers()
{
    $(document.body).on('click',"button.redditSelect",searchSubredditByClick );
    $( "#searchButton" ).on( "click" , searchSubredditByForm );
    $( "#favPopModal" ).on( "click" , function() { $( "#favModal" ).modal(); } );
    $( "#addFavSubmitBtn" ).on( "click" , handleAddFavorite );
    showFavorites();
    setupSearchTypeahead();
}

//setups the typeahead autocomplete for the search box
function setupSearchTypeahead()
{
    var subredditHound = new Bloodhound(
    {
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('keyword'),//only compare the keyword attribute of the object,and ignore whitespace
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: 'https://www.reddit.com/subreddits/search.json?q=%QUERY',
            wildcard: '%QUERY',
            filter: function (response) 
            {
                return $.map(response.data.children, function( subreddit ) 
                {
                    //clunky solution for showing all the results,have keyword be the actual string that was searched
                    //but use title as the string shown in autocomplete dropdown
                    return { keyword: $( "#redditSearch" ).val(), title: subreddit.data.display_name };
                });
            }
        }
    });

    $('#redditSearch').typeahead(null, {
      name: 'subreddits',
      display: 'title',
      source: subredditHound
    });
}

