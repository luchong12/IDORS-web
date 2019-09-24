/* eslint-disable no-undef */

let $star;
let $homeContent;
let $tweet;
let $hatefulTweet;
let $hate;
let $voteH;
let $voteR;
let $voteM;
let $voteP;
let $voteO;
let $notHate;
let $skipHate;
let $skipSubclass;
let $isOffensive;

const voteCodeToText = {
    'homophobia': "Homofóbico",
    'racism': "Racista",
    'misoginy': "Misógino",
    'political': "Ideológico",
    'other': "Otro"
};

let tweets = [];
let classifiedTweet = null;
let classifiedAvailable = false;
let voteCount = 0;

$(document).ready(function () {
    setupElements();
    setupPlaceload();
    getRandomTweets();
    setUiListeners();
});

function setupElements() {
    $star = $('*');
    $homeContent = $('#home-content');
    $tweet = $('#unk-tweet-text');
    $hatefulTweet = $('#hateful-tweet-text');
    $hate = $('#hate');
    $voteH = $('#homophobia');
    $voteR = $('#racism');
    $voteM = $('#misoginy');
    $voteP = $('#political');
    $voteO = $('#other');
    $notHate = $('#not-hate');
    $skipHate = $('#answers .btn-skip');
    $skipSubclass = $('#answers-subclass .btn-skip');
    $isOffensive = $('#is-offensive');
}

function showTweet(tweet) {
    $tweet.fadeOut(200, function () {
        $tweet.html(tweet.text.replace(/\n/mg, '<br/>'));
        $tweet.fadeIn(200);
    });
}

function setupPlaceload() {
    Placeload
        .$('#tweet-text')
        .config({speed: '1s'})
        .line(function (element) {
            return element.width(100).height(15);
        })
        .config({spaceBetween: '7px'})
        .line(function (element) {
            return element.width(100).height(15);
        })
        .config({spaceBetween: '7px'})
        .line(function (element) {
            return element.width(40).height(15);
        }).fold(function () {
    }, function () {
    });
}

function getRandomTweets() {
    $.getJSON('tweets/random', function (data) {
        if(data.length === 0) {
            getClassifiedTweet(() => {
                if(classifiedAvailable)
                    changeMode('subclass');
                else
                    changeMode('end');
            });
        }
        else {
            tweets = data;
            changeMode('hate');
        }
    });
}

function getClassifiedTweet(callback) {
    $.getJSON('tweets/classified/random', function (data) {
        if(!$.isEmptyObject(data)) {
            classifiedTweet = data;
            classifiedAvailable = true;
        }
        else {
            classifiedAvailable = false;
        }
        if(typeof callback !== 'undefined')
            callback();
    });
}

function setUiListeners() {
    $hate.click(function () {
        toggleButtons('all', false);
        vote('1');
        $hate.addClass('no-hover');
    });

    $hate.on('mousemove mousewdown', function () {
        $hate.removeClass('no-hover');
    });

    $notHate.click(function () {
        toggleButtons('all', false);
        vote('0');
        $notHate.addClass('no-hover');
    });

    $notHate.on('mousemove mousewdown', function () {
        $notHate.removeClass('no-hover');
    });

    $voteM.click(function () {
        toggleButtons('all', false);
        voteType('misoginy');
    });

    $voteR.click(function () {
        toggleButtons('all', false);
        voteType('racism');
    });

    $voteH.click(function () {
        toggleButtons('all', false);
        voteType('homophobia');
    });

    $voteP.click(function () {
        toggleButtons('all', false);
        voteType('political');
    });

    $voteO.click(function () {
        toggleButtons('all', false);
        voteType('other');
    });

    $skipHate.click(function () {
        toggleButtons('all', false);
        vote('2', true);
    });

    $skipSubclass.click(function () 
    {
        toggleButtons('all', false);
        voteType('skip');
    });

    $('button').mouseup(function () {
        $(this).blur();
    });
}

function toggleButtons(mode, enabled) {
    if(mode === 'hate' || mode === 'all') {
        $hate.prop('disabled', !enabled);
        $notHate.prop('disabled', !enabled);
        $skipHate.prop('disabled', !enabled);
    }

    if(mode === 'subclass' || mode === 'all') {
        $voteM.prop('disabled', !enabled);
        $voteO.prop('disabled', !enabled);
        $voteH.prop('disabled', !enabled);
        $voteP.prop('disabled', !enabled);
        $voteR.prop('disabled', !enabled);
        $skipSubclass.prop('disabled', !enabled);
    }
}

function changeMode(mode) {
    if(mode === 'hate') {
        $('#answers-subclass').fadeOut(200, () => {
            $('#answers-subclass').css("display", "flex").hide();
            $('#answers').fadeIn(200);
        });
        $('.question').fadeOut(200, () => {
            $('.question').html(
                "¿El tweet profesa " + 
                "<a id=\"hateDef\" class=\"btn btn-link btn-inline\" data-toggle=\"modal\" data-target=\"#hate-def\">" +
                    "discurso de odio" +
                "</a>?");
            $('.question').fadeIn(200);
        });
        showTweet(tweets[0]);
    }
    else if(mode === 'subclass') {
        $('#answers').fadeOut(200, () => {
            $('#answers-subclass').css("display", "flex").hide();
            $('#answers-subclass').fadeIn(200);
        });
        $('.question').fadeOut(200, () => {
            $('.question').text("¡Ya clasificaste este Tweet! ¿Podés identificar que tipo de discurso de odio contiene?");
            $('.question').fadeIn(200);
        });
        showTweet(classifiedTweet);
    }
    else if(mode === 'end') {
        $('#answers').fadeOut(200);
        $('#answers-subclass').fadeOut(200);
        $('.question').fadeOut(200);
        showTweet({text: 'Wow! Clasificaste todos los tweets <br />Gracias por tu ayuda!'});
    }
}

function vote(voteOption, skip=false) {
    const currentTweet = tweets.shift();
    
    if(tweets.length > 0 && !classifiedAvailable) {
        showTweet(tweets[0]);
    } else if(voteCount >= 1 && classifiedAvailable) {
        changeMode('subclass');
    }
    
    $.post('vote', {
        tweetId: currentTweet.id,
        isHateful: voteOption,
        skip,
        ignoreTweetIds: [tweets.length > 0 ? tweets[0].id : '', tweets.length > 1 ? tweets[1].id : ''],
        isOffensive: ($isOffensive.prop('checked') == true) ? '1' : '0',
    }, function (tweet) {        
        if(!$.isEmptyObject(tweet))
            tweets.push(tweet);

        if(!skip)
            voteCount++;

        if(tweets.length === 0 && !classifiedAvailable) {            
            getClassifiedTweet(() => {
                if(classifiedAvailable) {
                    changeMode('subclass');
                    toggleButtons('subclass', true);
                }
                else
                    changeMode('end');
            });
        }
        else { 
            if(voteCount >= 2 && classifiedAvailable) {
                voteCount = 0;
                toggleButtons('subclass', true);
            }
            else {
                if(voteCount >= 2)
                    getClassifiedTweet();
                
                toggleButtons('hate', true);
            }
        }
    }, 'json');

    $.mdtoast(toastText(voteOption), {duration: 3000});

    $isOffensive.prop('checked', false);
}

function voteType(voteOption) {
    
    if(tweets.length > 0) {
        classifiedAvailable = false;
        changeMode('hate');
    }
    
    $.post('vote/hateType', {
        tweetId: classifiedTweet.id,
        skip: voteOption === 'skip',
        hateType: voteOption,
        other: voteOption === 'other' ? $('#other-input').val() : ''
    }, function (tweet) {
        if(tweets.length === 0) {
            if(!$.isEmptyObject(tweet)) {
                classifiedTweet = tweet;
                showTweet(classifiedTweet);
                toggleButtons('subclass', true);
            } else
                changeMode('end');
        }
        else
            toggleButtons('hate', true);
    }, 'json');

    $('#other-input').val('');

    $.mdtoast(toastText(voteOption), {duration: 3000});
}

function toastText(voteOption) {
    if (voteOption === '1') {
        return "Clasificado como odioso. ¡Gracias!";
    } else if (voteOption === '0') {
        return "Clasificado como no odioso. ¡Gracias!";
    } else if (voteOption === '2' || voteOption === 'skip') {
        return "Tweet salteado. ¡Gracias!";
    } else {
        return "Clasificado como "
            + removeNonWords(voteCodeToText[voteOption]).toLowerCase()
            + ". ¡Gracias!";
    }
}

function removeNonWords(text) {
    return text.replace(/[^\w\sáéíóúÁÉÍÓÚüÜñÑ]/g, "");
}