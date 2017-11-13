/*
    File: main.js
    Author: Dilan Jenkins
    Project: RedditViewer
*/

//creates and returns a div.card skeleton
//does NOT add the card to the DOM
function createCard()
{
    var myDiv = $( "<div />" );
    myDiv.addClass( "card" );
    myDiv.addClass( "text-white" );
    myDiv.addClass( "bg-info" );
    myDiv.addClass( "mb-3" );
    return myDiv;
}

/*
    Go through all the cards on the page and reposition the dummy-cards so that they are at the end of the page.
    This gets rid of any gaps.
*/
function repositionCards()
{
    var myDecks = $( "div.card-deck" );
    if ( myDecks.length == 0 )
    {
        console.log( "NO DECKS" );
        return;
    }

    var nonDummyCards = [];
    var dummyCards = [];
    $( "div.card" ).each( function()
    {
        $( this ).detach();
        if ( $( this ).hasClass( "dummy-card" ) )
        {
            dummyCards.push( $( this ) );
        }
        else
        {
            nonDummyCards.push( $( this ) );
        }
    });

    //reattach the cards to the rows in order
    var i;
    for ( i = 0; i < nonDummyCards.length; i++ )
    {
        var deckIndex = Math.floor( i / 4 );
        $( myDecks ).eq( deckIndex ).append( nonDummyCards[ i ] );
    }

    //append the dummy cards to the ending rows
    var lastCardIndex = i;
    for ( i = 0; i < dummyCards.length; i++ )
    {
        var deckIndex = Math.floor( ( lastCardIndex + i ) / 4 );
        $( myDecks ).eq( deckIndex ).append( dummyCards[ i ] );
    }
}

//creates and returns an h4.card-title skeleton
//does NOT add the <h4> to the DOM
function createCardTitle()
{
    var bodyTitle = $( "<h4 />" );
    bodyTitle.addClass( "card-title" );
    return bodyTitle;
}

//creates and returns a div.card-body skeleton
//does NOT add the <div> to the DOM
function createCardBody()
{
    var divBody = $( "<div />" );
    divBody.addClass( "card-body" );

    return divBody;
}

/*
    Returns the correct url to the thumbnail
    Parameters:
        thumbnail, the thumbnail within the reddit listing
    Returns:
        if thumbnail is undefined or "self" or "image" or "default" then "emptyThumb.jpg" is returned
        otherwise thumbnail is returned
*/
function getThumbnailSrc( thumbnail )
{
    //if the thumbnail exists,set the cardImg src to the thumbnail url
    if ( thumbnail && thumbnail != "self" && thumbnail != "image" && thumbnail != "default" )
    {
        return thumbnail;
    }
    else
    {
        return "./emptyThumb.jpg";
    }
}

/*
    creates and returns an img.card-img-top skeleton with thumbnail src given
    does NOT add the img to the DOM
    Parameters:
        thumbnail: a url that the img should set its src attribute to
            if undefined,this function uses emptyThumb.jpg as the src attribute
    Return:
        jQuery object of the created img.card-img skeleton
*/
function createCardImage( thumbnail )
{
    var cardImg = $( "<img />" );
    cardImg.addClass( "card-img-top" );
    cardImg.attr( "alt" , "Card image cap" );
    //cardImg.attr( "height" , 180 );

    cardImg.attr( "src" , getThumbnailSrc( thumbnail ) );

    return cardImg;
}

/*
    creates and returns an a.card-link skeleton with the linkText and permalink given
    does NOT add the <a> to the DOM
    Parameters:
        linkText: the text to be contained within the <a> tag
        permalink: the very end of the url that the tag should link to,this gets appended to the reddit url
            if undefined,then this html page is used as the link url
    Returns:
        jQuery object of the created a.card-link skeleton
*/
function createBodyLink( linkText, permalink )
{
    var bodyLink = $( "<a />" );
    bodyLink.addClass( "card-link" );
    bodyLink.contextmenu( rightClickLink );
    bodyLink.text( linkText );
    if ( permalink != undefined )
    {
        bodyLink.attr( "href" , "https://www.reddit.com" + permalink );
    }
    else
    {
        bodyLink.attr( "href" , "#" );
    }

    return bodyLink;
}

/*
    creates and returns a card from the reddit post data given and adds it to the DOM under the div.card-deck given as myDeck
    this function does add the created card to the DOM
    Parameters:
        myData: an object containing the data for the post to be output
        myDeck: a jQuery object that the created card should be prepended to
    Returns:
        jQuery object of the created card,the card has been added to the DOM
*/
function cardFactoryFromPost( myData, myDeck )
{
    //create each of the components for the card
    var myDiv = createCard();
    var divBody = createCardBody();
    var bodyTitle = createCardTitle();
    var bodyLink = createBodyLink( myData.title, myData.permalink );

    //prepend the card to the current deck,IMPORTANT: this has to be done before any elements are appended to myDiv itself
    $( myDeck ).prepend( myDiv );
    //add each of the created components
    $( myDiv ).append( createCardImage( myData.thumbnail ) );
    $( myDiv ).append( divBody );
    $( bodyTitle ).append( bodyLink );
    $( divBody ).append( bodyTitle );
    return myDiv;
}

/*
    Outputs the data given into a bootstrap card and appends it to the deck given by myDeckIndex
    Parameters:
        cardDecks: a list of jquery objects,each element is a div.card-deck
        myDeckIndex: the index in the cardDecks that the card is meant to be added to
        myData: An object representing a reddit post
    Return: jQuery object of the div.card returned from cardFactoryFromPost
*/
function outputCard( cardDecks, myDeckIndex, myData )
{
    return cardFactoryFromPost( myData, cardDecks[ myDeckIndex ] );
}

/*
    Hides the progress bar and resets it back to zero.
    Logs the message given to the console
*/
function stopSearch( message )
{
    console.log( message );
    finishProgress();
    repositionCards();
}

/*
    Outputs the posts that are contained in the responseObj given,using outputCard function
    Parameters:
        responseObj: an object representing the response from the reddit server for a particular subreddit
        afterParam:  fullname of a reddit post,is used to get the next set of results
    Effects:
        requests additional posts from the subreddit if afterParam is not undefined or the length of responseObj is not zero
            sends this request 1 second in the future so as to not overwhelm reddit
    Return: Nothing
*/
function outputSubreddit( responseObj, afterParam )
{
    var i;
    var cardDecks = [];
    var actualIndex = -1;
    var afterDate = convertDateToTime( $( "#searchDate" ).val() );

    //if the number of posts in the responseObj is zero,then return and stop searching
    //or if the afterParam given is undefined,then return and stop searching
    if ( responseObj.length == 0 || afterParam == undefined )
    {
        stopSearch( "STOPPED LENGTH: " + responseObj.length + " AFTER: " + afterParam );
        return;
    }

    //go through each post returned,if the post comes after the specified date then prepend it to the main view
    //  otherwise,ignore the post
    //use actualIndex to get the total number of posts that come after the specified date so far
    for ( i = 0; i < responseObj.length; i++ )
    {
        var myData = responseObj[ i ].data;
        //if the post was created before the date given in the searchDate input,then skip that post
        if ( myData.created_utc < afterDate )
        {
            continue;
        }
        actualIndex++;

        //if the card deck does not exist,create a new card deck and use it as the card deck for this row
        var myDeckIndex = Math.floor( actualIndex / 4 );
        if ( cardDecks.length <= myDeckIndex )
        {
            cardDecks.push( $( "<div />" ) );
            cardDecks[ myDeckIndex ].addClass( "card-deck" );
            $( "#mainBodyDown" ).prepend( cardDecks[ myDeckIndex ] );
        }

        outputCard( cardDecks, myDeckIndex, myData );
    }

    //if there were no posts that were displayed then return and stop searching
    if ( actualIndex == -1 )
    {
        stopSearch( "STOPPED EMPTY" );
        return;
    }

    //if the number of cards was not divisible by 4,need to add dummy cards to pad out the last row
    var postsLeftLastRow = ( actualIndex + 1 ) % 4;
    for ( i = 0; i < 4 - postsLeftLastRow; i++ )
    {
        if ( postsLeftLastRow == 0 )
        {
            break;
        }
        var myDeckIndex = Math.floor( actualIndex / 4 );
        var myData = { "title" : "DUMMY-CARD" };
        var dummyCard = outputCard( cardDecks, myDeckIndex, myData );
        dummyCard.addClass( "dummy-card" );
        
    }

    //request the next set of results from the subreddit in one second
    setTimeout( function() { requestSubreddit( currentSubreddit, afterParam ) }, 1000 );
}

/*
    Called when the page is done loading the base HTML/CSS
    Update the searchDate input to the current date
    Initiate search request using the default subreddit
    Add event handlers for searching by subreddit
*/
$( document ).ready( function()
{
    //set the date on the searchDate input to today's date    
    $( "#searchDate" ).val( getFormatCurrentDate() );
    //hide the progress bar since there is no search happening at the moment
    $( "#waiting" ).css( "display" , "none" );
    //Add text to the mainBody instructing user to search a subreddit
    $( "#mainBodyDown" ).html( "Welcome to Quickview. <br>Here you can see posts for a particular subreddit that were posted after a certain date. <br>Select or search for a subreddit to begin." );
    //call function to setup the event handlers
    setupHandlers();
});


