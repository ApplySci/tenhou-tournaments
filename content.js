/* jshint esversion: 6 */
/* global chrome,tournaments */

'use strict';

const observerSettings = {
    characterData: true,
    childList: true,
    subtree: true,
};

let mutationObserver;
let partialPhrases;

function translateOneNode(node) {

    const originalText = node.nodeValue;
    let thisParent = node.parentElement;
    let newText = originalText;

    for (let needle of partialPhrases) {
        if (newText.includes(needle)) {
            newText = newText.replace(needle, tournaments[needle]['DEFAULT']);
        }
    }


    if (newText !== originalText) {
        if (thisParent.tagName.toLowerCase() === 'span') {
            thisParent.parentElement.style.overflow = 'hidden';
        } else {
            thisParent.style.overflow = 'hidden';
        }

        const newNode = document.createTextNode(newText);

        newNode.originalValue = originalText;
        thisParent.replaceChild(newNode, node);
    }
}


const translateTextBeneathANode = function(topNode) {
    const textNodeIterator = document.createTreeWalker(topNode, NodeFilter.SHOW_TEXT, null, false);

    // We are messing with the Dom tree while we iterate over it, so first save in an array
    let textNodeList = [];

    while (textNodeIterator.nextNode()) {
        textNodeList.push(textNodeIterator.currentNode);
    }

    for (let node of textNodeList) {
        translateOneNode(node);
    }
};

function setToObserve() {

    mutationObserver.observe(document.documentElement, observerSettings);

}


function retranslateAll() {

    // restore all nodes to their original value, then translate them if needed
    translateTextBeneathANode(document.body);

    document.title = 'Tenhou: create tournament lobby';
    
    let elem = document.querySelector('input[value=大会ロビーを作成する]');
    if (elem) {
        elem.value='Create tournament';
    }

    elem = document.querySelector('input[name=T]');
    if (elem && elem.value == "第○○回　○○○○○杯") {
        elem.value = '';
        elem.placeholder = 'Public name of tournament here';
    }

}

function setOptions(options, ignored = null, ignored2 = null) {

    // Sort by key length, so that when performing partial matching,
    // the entry with more matching characters will have priority
    partialPhrases = Object.keys(tournaments).sort((a, b) => {
        return b.length - a.length;
    });

    retranslateAll();
    
    setToObserve();

}

function onMutate(mutations) {

    mutationObserver.disconnect();
    mutations.forEach((oneMutation) => translateTextBeneathANode(oneMutation.target));
    setToObserve();

}

mutationObserver = new MutationObserver(onMutate);

setOptions();

translateTextBeneathANode(document.body, false, true);

document.querySelectorAll("form[name=fe] input[type=radio]").forEach(function isItOn(el) {
    if (el.parentElement.innerText === 'Off' &&
        el.parentElement.parentElement.parentElement.children[2].innerText === 'Off' ) {
        // move the OFF radio button so that it always comes before the ON radio button
        el.parentElement.parentElement.parentElement.children[0].after(el.parentElement.parentElement);
    }
});

