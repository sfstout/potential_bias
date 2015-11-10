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
//	      paragraph: A string which is parsed for the triggering words/phrases
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
            i = biasPhrase.endIndex;
            biasSources.push(biasPhrase.match);
        }
    }
    return removeDuplicatesFromArray(biasSources);
}

// Test stuff

var testParagraph = "Comcast’s corporate headquarters, Comcast Center, is the tallest building in Philadelphia. It’s covered in mirrors, which makes it the perfect metaphor for the company, one former employee says; no matter where you go, the glare is in your eyes.\n\nIt seems a lot of people share that sentiment.\n\nComcast earned Consumerist’s “Worst Company in America” title twice, first in 2010 and again this year, 2014. It ranks at the very bottom of the American Consumer Satisfaction Index, underperforming even the rest of the cable industry, where “high prices, poor reliability, and declining customer service” are endemic.\n\nIn mid-July, AOL executive Ryan Block placed a call to Comcast customer service in an effort to cancel his service. What ensued was an 18-minute, Kafkaesque struggle with an overly persistent employee, which Block partially recorded and posted online. The recording went viral, and has now been listened to more than 5 million times. The interaction was covered by every major news network, immortalized in a New Yorker cartoon, and included in a David Letterman top 10 list (“Lesser-known Labors of Hercules”). “It hit the cultural zeitgeist something fierce,” Block says. “I guess it touched some kind of nerve. It was a keyed-up, aggressive version of a call I think most people have had.”\n\nThousands of Comcast customers across the country have experienced similar customer service nightmares when dealing with the company. Usually these involve multiple rounds of phone calls, missed technician appointments, and unexpected fees. In fact, forums like comcastmustdie.com and the Comcast section of Reddit have been created to give customers a dedicated space to vent.";
var testTriggers = generateTriggersObject(['Comcast', 'AOL', 'David Letterman']);

console.log(parseForBias(testTriggers, testParagraph))