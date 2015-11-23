// Regex by which to split the input paragraph
var splitRegex = /\s|\.|,|'/;

// Class which acts as a Trie for words
// Has two optional constructors, can take a string or an
// array of strings to build the initial trie with
// Input: p: String or Array of Strings
// String -> wordTrie OR [String] -> wordTrie
function wordTrie (p) {
    if (typeof p === 'string') {
        this.addPhrase(p);
    } else if ( Object.prototype.toString.call(p) === '[object Array]' ) {
        this.addPhraseByArray(p, 0);
    }
}

// Function which adds a phrase to the wordTrie by way of string array
// Inputs: a: array of strings
//         i: index of where to look in the array of strings
// Output: None
// [String] -> Int -> Modified wordTrie
wordTrie.prototype.addPhraseByArray = function (a, i) {
    if (!this[a[i]]) { // Not in the trie yet
        if (a[i + 1]) {
            this[a[i]] = [new wordTrie(), false];
            this[a[i]][0].addPhraseByArray(a, i + 1);
        } else {
            this[a[i]] = [new wordTrie(), true];
        }
    } else { // In the trie already
        if (a[i + 1]) {
            this[a[i]][0].addPhraseByArray(a, i + 1);
        } else if (i === a.length - 1) {
            this[a[i]][1] = true;
        }
    }
}

// Function which adds a phrase to the wordTrie by way of string
// Input: p: String which is the phrase to add to the wordTrie
// Output: None
// String -> Modified wordTrie
wordTrie.prototype.addPhrase = function (p) {
    var pa = p.split(splitRegex);
    if (!this[pa[0]]) {
        if (pa[1]) {
            this[pa[0]] = [new wordTrie(), false];
            this[pa[0]][0].addPhraseByArray(pa, 1);
        } else {
            this[pa[0]] = [new wordTrie(), true];
        }
    } else {
            if (pa[1]) {
                this[pa[0]][0].addPhraseByArray(pa, 1);
            } else if (pa.length === 1) {
                this[pa[0]][1] = true;
            }
        }
    }

// Takes an array of words & phrases and generates the triggers object
// Inputs: a: An array of strings
// Output: A triggers object
// [String] -> {}
function generateTriggersObject (a) {
    var i;
    var ret = {};
    var phrase;
    for (i = 0; i < a.length; i++) {
        if (!ret[a[i]]) { // Not already in there
            if (/\s/.test(a[i])) { // Dealing with a phrase
                phrase = a[i].split(splitRegex);
                if (!ret[phrase[0]]) {
                    ret[phrase[0]] = new wordTrie(a[i]);
                } else if (ret[phrase[0]] === true) {
                    ret[phrase[0]] = new wordTrie(phrase[0]);
                    ret[phrase[0]].addPhrase(a[i]);
                } else {
                    ret[phrase[0]].addPhrase(a[i]);
                }
            } else { // dealing with a word
                ret[a[i]] = true;
            }
        } else { // Single word already there
            if (ret[a[i]] === true) {
                ret[a[i]] = new wordTrie();
            }
            ret[a[i]].addPhrase(a[i]);
        }
    }
    return ret;
}

// Removes duplicates from an array.
// Input: a: An array
// Output: An array
// [a] -> [a]
function removeDuplicatesFromArray (a) {
    var i;
    var obj = {};
    var ret = [];
    for (i = 0; i < a.length; i++) {
        if (!obj[a[i]]) {
            ret.push(a[i])
        }
        obj[a[i]] = true;
    }
    return ret;
}

// Input: paragraph: An array of words which is being parsed for the phrase
//        startIndex: Where to start searching in the paragraph array
//        trie: a structure which is used to find the longest match
// Output: Object with properties endIndex and match. endIndex is the
//         index of the last match of the phrase trie. match is the
//         longest potential match found in the trie
// trie structure: [{Cont: [{}, isMatch]}, isMatch]
// [String] -> Int -> Trie -> {endIndex: Int; match: String}
function parseForBiasPhrase (paragraph, startIndex, trie) {
    var longestMatch = [];
    var i = startIndex + 1;
    var lastMatchIndex = startIndex - 1;
    var k;
    if (trie[1]) {
        longestMatch.push(paragraph[startIndex]);
        lastMatchIndex = startIndex;
    }
    while (trie[0][paragraph[i]]) { // While we can continue
        if (trie[0][paragraph[i]][1]) { // Match
            for (k = lastMatchIndex + 1; k <= i; k++) {
                longestMatch.push(paragraph[k]);
            }
            lastMatchIndex = i;
        }
        trie = trie[0][paragraph[i]];
        i++;
    }
    return {endIndex: startIndex, match: longestMatch.join(' ')};
}

// A function which takes in a hash of trigger words and phrases as well as 
// a paragraph to parse and returns an array which contains all of the 'offending'
// words and phrases
// Input: triggers: An object which contains the trigger words as keys, values
//                  are either true or a trie type structure for phrase detection
//        paragraph: A string which is parsed for the triggering words/phrases
// Output: Array of bias words/phrases detected in the input paragraph
// {} -> String -> []
function parseForBias (triggers, paragraph) {
    var pa = paragraph.split(splitRegex);
    var pap = [];
    var i;
    var biasSources = [];
    var biasPhrase;
    for (i = 0; i < pa.length; i++) {
        if (pa[i] !== '') {
            pap.push(pa[i])
        }
    }
    pa = pap
    for (i = 0; i < pa.length; i++) {
        if (triggers[pa[i]] === true) { // Single word match
            biasSources.push(pa[i]);
        } else if (triggers[pa[i]]) { // Potential phrase match
            biasPhrase = parseForBiasPhrase(pa, i, triggers[pa[i]][pa[i]] );
            if (biasPhrase.match) {
                i = biasPhrase.endIndex;
                biasSources.push(biasPhrase.match);
            }
        }
    }
    return removeDuplicatesFromArray(biasSources);
}

// A function which gets the article on the page and returns it in text format
// Currently only does anything for theverge.com
// Input: url: A string which is the current url
// Output: A string which is the article to be parsed
// String -> String
/*function getArticle (url) {
    var article = "";
    var temp;
    var i;

    if (url.indexOf('theverge') !== -1) {
        temp = document.querySelectorAll('.article-body');
        for (i = 0; i < temp.length; i++) {
            article += temp[i].innerText + ' '; 
        }
        temp = document.querySelectorAll('.m-article__entry');
        for (i = 0; i < temp.length; i++) {
            article += temp[i].innerText + ' '; 
        }
        temp = document.querySelector('#feature-body');
        if (temp) {
            article += temp.innerText;
        }
    }

    return article;
}*/

// A function which gets the article on the page and returns it in text format
// Input: queries: An array of strings which represent how to query the HTML page
//                in order to grab the article
// Output: A string which is the article to be parsed
// [String] -> String
function getArticle (queries) {
    var article = "";
    var temp;
    var i,j;
    for (i = 0; i < queries.length; i++) {
        temp = document.querySelectorAll(queries[i]);
        for (j = 0; j < temp.length; j++) {
            article += temp[j].innerText + ' ';
        }
    }
    return article;
}

// A function which gets the element to which to attach the disclaimer
// Input: queries: An array of strings which represent how to query the HTML page
//                in order to get the element to which to attach
// Output: The element to which to attach the disclaimer
// [String] -> HTMLNode
function getAppendTo (queries) {
    var i;
    for (i = 0; i < queries.length; i++) {
        temp = document.querySelector(queries[i]);
        if (temp) {
            return temp;
        }
    }
    return document.querySelector('body') || document; // I think this works
}


// Currently a dummy function
// Input: url: a string which is the current url
// Output: An array of strings which acts as a list of trigger words and phrases
// String -> [String]
/*function getTriggers (url) {
    return generateTriggersObject(['Comcast', 'AOL', 'David Letterman']);
}*/

// returns a triggers object
// Input: triggers: an object which contains the triggers as keys and the discaimer
//                  for finding that key as values
// Output: A triggers Object
// {String: String} -> {}
function getTriggers (triggersMap) {
    var arr = [];
    var k;
    for (k in triggersMap) {
        arr.push(k);
    }
    return generateTriggersObject(arr);
}

// This works currently, but it may want to be modified
// Input : triggers: an array of strings which are the triggers on the current page
//         triggersMap: an object which contains the triggers as keys and the 
//                      associated disclaimer as its value
// Output: The HTML to insert into the page
// [String] -> HTMLNode?
function generateDisclaimers (triggers, triggersMap) {
    var i;
    var disclaimer = document.createElement('ul');
    disclaimer.className = '--pbe-disclaimer'
    var temp;
    if (triggers.length === 0) {
        return null;
    }
    temp = document.createElement('li');
    temp.innerText = 'Disclaimer:';
    disclaimer.appendChild(temp);
    for (i = 0; i < triggers.length; i++) {
        temp = document.createElement('li');
        temp.innerText =  triggersMap[triggers[i]];
        disclaimer.appendChild(temp);
    }
    return disclaimer;
}

// Runs on page load
(function () {

    // How I want this to eventually work is roughly like:
    /*
        the getArticle function should preferably take an array of where to scrape for the article.
        It should be something like do a querySelectorAll on each element in the array, adding these
        contents to the article, then parsing the article. So in effect, getArticle should just be 
        basically a shell which does a bunch of foreach loops. If the article comes back blank,
        degrade to getting the innerText of the document body

        getTriggers ultimately just needs to provide an array of trigger words and phrases. It might
        also give back an object which gives the eventual disclaimer which will be attached to the
        article later

        the appendTo variable should come about in a similar way to getArticle, in that it should ask
        the server 'for this site, what should I append the disclaimer to?'. What should come back is
        an array of strings which should be attempted to be querySelected, if the first comes back null,
        try the next, if that's null, try the next, etc. Eventually degrade to just attaching to the 
        document body

        // Get this from the server
        var info = {
                        siteName : String, // Maybe unnecessary?
                        getArticleFrom : [String],
                        triggers : {
                            trigger : String
                        },
                        appendTo : [String]
        };

        siteName        : Just the name of the site. This is probably not actually needed
        getArticleFrom  : An array of strings of which to grab the innerText of to append to the article
                          body which will then be parsed. If at the end of this process the article is
                          still empty, then degrade to grabbing the innerText of the document body.
        triggersMap     : An object whose keys are the different trigger words and phrases (objects can 
                          have multi-word strings as keys). It is delivered in this form so that a 
                          TriggersObject can be made with the keys, then when the final parseForBias 
                          array gets created, it can be traversed and the values of these keys will be 
                          added to the final disclaimer
        appendTo        : An array of strings which should be sorted in order of priority of where to 
                          attach the final disclaimer. Once one of these is successfully found, the 
                          disclaimer is attached here and the attaching function quits. If no appendTo 
                          values can be successfully found using document.querySelector, then just 
                          degrade to attaching to the document body.
    */

    // This should come from the server
    var info = {
        getArticleFrom: ['.article-body','.m-article__entry','#feature-body'],
        triggersMap: { "Comcast": "The Verge is owned by Vox which owns Comcast",
                    "AOL": "The Verge is associated with AOL",
                    "David Letterman": "The Verge is paid by David Letterman"
        },
        appendTo: ['.m-article__sources', 'article']
    }

    var article = getArticle(info.getArticleFrom);
    var triggers = getTriggers(info.triggersMap);
    var appendTo = getAppendTo(info.appendTo);
    var disclaimers = generateDisclaimers(parseForBias(triggers, article), info.triggersMap);

    if (disclaimers !== null) {
        appendTo.appendChild(disclaimers);
    }
})();