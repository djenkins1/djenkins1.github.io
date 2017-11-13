/*
    File: poster.js
    Author: Dilan Jenkins
    Project: RedditViewer
*/
//
//DO NOT INCLUDE MAIN.JS ALONGSIDE THIS SCRIPT FILE

//holds username: totalPosts for the number of posts for a particular username in the subreddit given.
var posterDict = {};

//clears out the info in the posterDict in case a new search is performed
function clearPosterData()
{
    posterDict = {};
}

/*
    Outputs the top 10 posters for the allPosterDict given
    Calls the function pointed to by finishFunc when finished
    Parameters:
        allPosterDict, dictionary containing key value pairs
            keys are reddit usernames and values are how many posts they have in the particular subreddit
        finishFunc, optional function to be called when this function is done
    Returns: Nothing
*/
function showPosterResults( allPosterDict, finishFunc )
{
    //add an <ol> element to the page
    var myGroup = $( "<ol />" );
    myGroup.addClass( "list-group" );
    $( "#mainBodyDown" ).append( myGroup );

    //stop showing the waiting text
    finishProgress();

    //put each of the key value pairs of allPosterDict into an array of tuples
    var keyValues = [];
    for ( var key in allPosterDict ) 
    {
        keyValues.push( [ key, allPosterDict[key] ] );
    }

    //sort the key value pairs
    keyValues.sort( function compare(kv1, kv2) 
    {
        // This comparison function has 3 return cases:
        // - Negative number: kv1 should be placed BEFORE kv2
        // - Positive number: kv1 should be placed AFTER kv2
        // - Zero: they are equal, any order is ok between these 2 items
        return kv1[1] - kv2[1];
    });

    //go through the list backwards since it is sorted and we want the people who have posted the most
    for ( var i = keyValues.length - 1; i >= 0; i-- )
    {
        //stop when the top 10 posters have been displayed
        //since loop is going backwards,stop 11 positions from the end of the array
        if ( i < keyValues.length - 11 )
        {
            break;
        }

        //add a li element with a link to the user,have text containing total posts
        var currentValuePair = keyValues[ i ];
        var myItem = $( "<li />" );
        myItem.addClass( "list-group-item" );
        var myItemLink = $( "<a />" );
        myItemLink.attr( "href" , "https://www.reddit.com/user/" + encodeURIComponent( currentValuePair[ 0 ] ) );
        myItemLink.text( currentValuePair[ 0 ] + " : " + currentValuePair[ 1 ] );
        $( myGroup ).append( myItem ); 
        $( myItem ).append( myItemLink );
    }

    //if the function given is not undefined,call it since we are finished here
    if ( finishFunc != undefined )
    {
        finishFunc();
    }
}

/*
    Given a json response object,determines if it can request more posts for the subreddit or if it should show the results
    Parameters:
        responseObj, reddit json object containing the posts for the subreddit searched
        afterParam, the after parameter to be sent to the reddit server if another request is to be made
    Returns: Nothing
*/
function outputSubreddit( responseObj, afterParam )
{
    //if the number of posts in the responseObj is zero,show results and stop searching
    if ( responseObj.length == 0 )
    {
        console.log( "STOPPED LENGTH" );
        showPosterResults( posterDict, clearPosterData );
        return;
    }

    //if the afterParam is undefined,there are no more posts to get,show results and stop searching
    if ( afterParam == undefined )
    {
        console.log( "STOPPED AFTER" );
        showPosterResults( posterDict, clearPosterData );
        return;
    }

    //for each of posts in the responseObj,add their author to the posterDict if they weren't part of it before
    //  if the author was already in the posterDict, then just increment the value for that particular author
    for ( i = 0; i < responseObj.length; i++ )
    {
        var myData = responseObj[ i ].data;
        if ( posterDict[ myData.author ] == undefined )
        {
            posterDict[ myData.author ] = 0;
        }
        posterDict[ myData.author ]++;
    }

    // send another request to reddit for more posts, do this 1 second in future so as to not overwhelm server
    setTimeout( function() { requestSubreddit( currentSubreddit, afterParam ) }, 1000 );
}

//called when the html/css for the page is done loading
$( document ).ready( function()
{
    //hide the progress bar since there is no search happening at the moment
    $( "#waiting" ).css( "display" , "none" );
    //Add text to the mainBody instructing user to search a subreddit
    $( "#mainBodyDown" ).html( "Welcome to Postview.<br>Here you can see the top 10 users who have posted to a particular subreddit.<br>Select or search for a subreddit to begin." );
    //call function to setup the event handlers
    setupHandlers();
});


