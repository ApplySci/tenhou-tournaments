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

    elem = document.querySelector('form[name=fe] input[name=M]');
    if (elem) {
        elem.placeholder = 'List of tenhou player names, one per line';
    }

    for (const selector of [
            'form[name=fe] textarea[name=M]',
            'form[name=fe] textarea[name=CM]',
            'form[name=fk] textarea[name=UN]',
            'form[name=fs] textarea[name=M]',
            ]) {
        elem = document.querySelector(selector);
        if (elem) {
            elem.placeholder = 'List of tenhou player names, one per line';
        }
    }

    let optionTables = document.querySelectorAll("form[name=fe] table table");

    addColGroup(optionTables[0], [40, 20, 20, 20]);
    addColGroup(optionTables[1], [45, 10, 10, 35]);

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


// ============================================================================
//
//              initialisation starts here

// Sort by key length, so that when performing partial matching,
// the entry with more matching characters will have priority

partialPhrases = Object.keys(tournaments).sort((a, b) => {
    return b.length - a.length;
});


retranslateAll();
rearangeRadios();
mutationObserver = new MutationObserver(onMutate);
setToObserve();


// translate javascript alert boxes

let actualCode = '(' + function() {
        let nativeAlert = window.alert;
        window.alert = function(textIn) {
            let textArray = textIn.split('\n');
            let elementToFocus = null;
            switch(textArray[0]) {
                case '大会名を入力してください':
                    elementToFocus = 'input[name=T';
                    textArray[0] = 'Tournament name cannot be blank';
                    break;
                case '「開始点数」「トップ必要点数」「清算原点」は同時に指定してください。':
                    elementToFocus = 'form[name=fe] input[name=RCS_04]';
                    textArray[0] = 'If you specify one of: starting score, minimum score needed, and points deducted at end of game, then you must specify all three.';
                    break;
                case 'ランキングを使用する場合には参加対象を「ゲストID不可」にしてください':
                    elementToFocus = 'form[name=fe] input[name=DISABLEGUESTID]';
                    textArray[0] = 'If you want to restrict players by dan or R, you must also prevent unregistered users from entering';
                    break;
                case '大会名は20文字以内で入力してください': // form won't allow longer names anyway
                    elementToFocus = 'form[name=fe] input[name=T]';
                    textArray[0] = 'Tournament name must be shorter than 21 characters';
                    break;
                case '開催期間をもう一度確認してください':
                    elementToFocus = 'form[name=fe] [name=R0]';
                    textArray[0] = 'Start date must be before End date';
                    break;
                case '段位指定をもう一度確認してください':
                    elementToFocus = 'form[name=fe] [name=DAN1]';
                    textArray[0] = 'Upper dan limit must not be lower than lower dan limit';
                    break;
                case 'Rate指定をもう一度確認してください':
                    elementToFocus = 'form[name=fe] [name=RATE1]';
                    textArray[0] = 'Upper R limit must not be lower than lower R limit';
                    break;
                case '対戦者を4人または3人(サンマ)で指定してください':
                    elementToFocus = 'form[name=fs] [name=M]';
                    textArray[0] = 'The number of players named must match the number of players required for a full table';
                    break;
                case '開始点数の指定方法に誤りがあります':
                    elementToFocus = 'form[name=fs] [name=M]';
                    textArray[0] = 'When specifying starting score for each player, there must be a single space between the player name, and the score, with no other spaces';
                    break;
                case '開始点数は400000以下で指定してください':
                    elementToFocus = 'form[name=fs] [name=M]';
                    textArray[0] = "No player's starting score can exceed 400,000";
                    break;
                case '開始点数は100点単位で指定してください':
                    elementToFocus = 'form[name=fs] [name=M]';
                    textArray[0] = 'Starting scores must be divisible by 100';
                    break;
                case '開始点数を指定する場合には全員分を指定してください':
                    elementToFocus = 'form[name=fs] [name=M]';
                    textArray[0] = 'If you specify a starting score for one player, you must specify it for all';
                    break;
                case '開始点数の合計が会場のルールと一致しません。':
                    elementToFocus = 'form[name=fs] [name=M]';
                    textArray[0] = 'The sum of the starting scores must equal the number of players x the default starting score';
                    textArray[1] = 'If you are using custom starting scores, check you have the correct value: if you change it, press UPDATE to save it before starting a game.';
                    textArray[2] = textArray[2].replace('指定した開始点数の合計', "Sum of players' starting scores");
                    textArray[3] = textArray[3].replace('会場のルールの開始得点の合計', 'Expected total (4 x tournament starting score)');
                    break;
/*
                case '参加許可は100人以内で指定してください':
                    elementToFocus = 'form[name=fe] [name=M]';
                    textArray[0] = 'Maximum 100 permitted players';
                    break;
                case 'チャット許可は100人以内で指定してください':
                    elementToFocus = 'form[name=fe] [name=CM]';
                    textArray[0] = 'Maximum 100 allowed to chat';
                    break;
*/
}
            if (elementToFocus !== null) {
                let focusElem = document.querySelector(elementToFocus);
                if (focusElem) {
                    focusElem.focus();
                } else {
                    console.log('could not find focusable element ' +elementToFocus);
                }
            }
            return nativeAlert(textArray.join('\n'));
        };
    } + ')();';

let script = document.createElement('script');
script.textContent = actualCode;
(document.head||document.documentElement).appendChild(script);
script.remove();

