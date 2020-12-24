/* jshint esversion: 6 */
/* global tournaments */

'use strict';

const observerSettings = {
    characterData: true,
    childList: true,
    subtree: true,
};

let mutationObserver;
let partialPhrases;


function translateString(textIn) {

    for (let needle of partialPhrases) {
        if (textIn.includes(needle)) {
            textIn = textIn.replace(needle, tournaments[needle].DEFAULT);
        }
    }    
    return textIn;

}

function translateOneNode(node) {

    const originalText = node.nodeValue;
    let thisParent = node.parentElement;
    let newText = translateString(originalText);
    
    if (newText !== originalText) {
        const newNode = document.createTextNode(newText);
        newNode.originalValue = originalText;
        thisParent.replaceChild(newNode, node);
    }
    
}


function catchRadio(el) {

    // this adds a custom css class to those options that are set to some value other than the tenhou default
    let newClass;
    if (el.value === '1' && el.checked) {
        newClass = 'nonDefaultOn';
    } else if (el.value === '0' && el.checked) {
        newClass = '';
    } else {
        return;
    }

    el.parentElement.parentElement.parentElement.childNodes[0].className = 'r ' + newClass;
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


function addColGroup(node, cols) {
    let firstChild = node.childNodes[0];
    if (firstChild.tagName === 'COLGROUP') {
        return;
    }
    let grp = document.createElement('colgroup');
    for (let i=0; i<4; i++) {
        let col = document.createElement('col');
        col.style.width = '' + cols[i] + '%';
        grp.insertBefore(col, null);
    }
    node.insertBefore(grp, firstChild);
}


function retranslateAll() {

    translateTextBeneathANode(document.body);

    // bespoke things for the tournament pages

    document.title = 'Tenhou: create tournament lobby';

    let elem = document.querySelector('input[value=大会ロビーを作成する]');
    if (elem) {
        elem.value='Create tournament';
    }

    elem = document.querySelector('input[name=T]');
    if (elem) {
        elem.placeholder = 'Public name of tournament here';
        if (elem.value == "第○○回　○○○○○杯") {
            elem.value = '';
            elem.focus();
        }
    }

    let optionTables = document.querySelectorAll("form[name=fe] table table");

    addColGroup(optionTables[0], [40, 20, 20, 20]);
    addColGroup(optionTables[1], [45, 10, 10, 35]);

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


function rearangeRadios() {
    document.querySelectorAll("form[name=fe] input[type=radio]").forEach(function isItOn(el) {
        catchRadio(el);
        el.addEventListener('change', () => catchRadio(el));
        if (el.parentElement.innerText === 'On') {
            el.parentElement.parentElement.className = 'radioOn';
        }
    });
}

mutationObserver = new MutationObserver(onMutate);
setOptions();
translateTextBeneathANode(document.body, false, true);
rearangeRadios();

// translate javascript alert boxes

let actualCode = '(' + function() {
        let nativeAlert = window.alert;
        window.alert = function(textIn) {
            let textArray = textIn.split('\n');
            let alertText = textArray[0];
            let elementToFocus = null;
            switch(alertText) { 
                case '大会名を入力してください':
                    elementToFocus = 'T';
                    alertText = 'Tournament name cannot be blank';
                    break;
                case '大会名は20文字以内で入力してください':
                    elementToFocus = 'T';
                    alertText = 'Tournament name must be shorter than 21 characters';
                    break;
                case '「開始点数」「トップ必要点数」「清算原点」は同時に指定してください。':
                    elementToFocus = 'RCS_04';
                    alertText = 'If you specify one of: starting points, minimum score needed, and points deducted at end of game, then you must specify all three.';
                    break;
                case '開催期間をもう一度確認してください':
                    elementToFocus = 'R1';
                    alertText = 'End date must be after start date';
                    break;
                case '段位指定をもう一度確認してください':
                    elementToFocus = 'DAN1';
                    alertText = 'Upper dan limit must not be lower than lower dan limit';
                    break;
                case 'Rate指定をもう一度確認してください':
                    elementToFocus = 'RATE1';
                    alertText = 'Upper R limit must not be lower than lower R limit';
                    break;
/*
                case '参加許可は100人以内で指定してください':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case 'チャット許可は100人以内で指定してください':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case 'ランキングを使用する場合には参加対象を「ゲストID不可」にしてください':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case '対戦者を4人または3人(サンマ)で指定してください':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case '開始点数の指定方法に誤りがあります':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case '開始点数は400000以下で指定してください':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case '開始点数は100点単位で指定してください':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case '開始点数を指定する場合には全員分を指定してください':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case '開始点数の合計が会場のルールと一致しません。':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case '':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case '':
                    elementToFocus = '';
                    alertText = '';
                    break;
                case '':
                    elementToFocus = '';
                    alertText = '';
                    break;
*/
            }
            if (elementToFocus !== null) {
                document.querySelector('input[name=' + elementToFocus + ']').focus();
            }
            textArray[0] = alertText;
            nativeAlert(textArray.join('\n'));
        }
    } + ')();';
    
let script = document.createElement('script');
script.textContent = actualCode;
(document.head||document.documentElement).appendChild(script);
script.remove();
