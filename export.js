// ==UserScript==
// @name     Export Claude.Ai
// @description Download the conversation with Claude
// @version  1
// @grant    none
// @match    *://claude.ai/*
// ==/UserScript==

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getElementTopPosition(element) {
  var topPosition = 0;
  while (element) {
    topPosition += element.offsetTop;
    element = element.offsetParent;
  }
  return topPosition;
}

function getTextByClass(className) {
    var elements = document.querySelectorAll(className);
    var result = [];

    for (var i = 0; i < elements.length; i++) {
        result.push(elements[i].innerText.trim());
    }

    return result.join("\n");
}


function getCoordinates(element) {
    var rect = element.getBoundingClientRect();
    return rect.top; // 返回元素距离顶部的距离
}


function openDialog() {
    var previewButton = document.querySelector('button[aria-label="Preview contents"]');
    if (previewButton) {
        previewButton.click();
    }
}

function closeDialog() {
    var closeButton = document.querySelector('button[data-testid="close-file-attachment"]');
    if (closeButton) {
        closeButton.click();
    }
}

async function openDialogAndGetTextAndClose(textArray,window) {
    var previewButton = window.querySelector('button[aria-label="Preview contents"]');
    if (previewButton) {
        previewButton.click();
        await sleep(1000); // 等待一秒以确保窗口内容加载完成

        var middleText = getTextByClass('.prose h-full overflow-auto w-full max-w-none whitespace-pre-wrap px-4 py-4 bg-uivory-100 rounded-bl-xl rounded-br-xl grid place-items-center');
        console.log(middleText)
        var closeButton = document.querySelector('button[data-testid="close-file-attachment"]');
        if (closeButton) {
            closeButton.click();
        }

        // 此时你可以使用 middleText 进行处理
        textArray.push(middleText);

        // 等待一秒以确保关闭窗口操作完成
        await sleep(1000);

    }
}





async function recursiveDownload(target, textArray) {
    var windowsSelector, contentsSelector;

    // 根据情况选择合适的选择器
    if (target.querySelectorAll('.sc-lbNsEr.klKkOh').length > 0) {
        windowsSelector = '.sc-iOmpNS.dTgxDB';
        contentsSelector = '.sc-lbNsEr.klKkOh';
    } else if (target.querySelectorAll('.sc-iOmpNS.dIpNRz').length > 0) {
        windowsSelector = '.sc-jeWJQQ.fvsWYZ';
        contentsSelector = '.sc-iOmpNS.dIpNRz';
    } else {
        // 处理没有匹配的情况
        return;
    }

    var windows = target.querySelectorAll(windowsSelector);
    var contents = target.querySelectorAll(contentsSelector);

    // 合并windows和contents元素为一个数组
    var combinedElements = Array.from(windows).concat(Array.from(contents));

    // 将combinedElements按距离顶部的距离升序排序
    var sortedElements = combinedElements.sort((a, b) => getCoordinates(a) - getCoordinates(b));


    // 处理contents元素
    for (var i = 0; i < sortedElements.length; i++) {
        var element = sortedElements[i];
        var elementText = "";

        if (element.matches(windowsSelector)) {
            var previewButton = element.querySelector('button[aria-label="Preview contents"]');
            if (previewButton) {
                previewButton.click();
            }

            await sleep(1000);
            var middleText = getTextByClass('.prose.h-full.overflow-auto.w-full.max-w-none.whitespace-pre-wrap.px-4.py-4.bg-uivory-100.rounded-bl-xl.rounded-br-xl.grid.place-items-center');
            closeDialog();
            await sleep(1000);
            textArray.push(middleText);
        } else if (element.matches(contentsSelector)) {
            var contentText = element.querySelector('.contents').innerText.trim();
            textArray.push(contentText);
        }


    }
}





function addButton() {
    var button = document.createElement("button");
    button.innerHTML = `Export`;
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background-color: #4CAF50; /* Green */
        border: none;
        color: white;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        cursor: pointer;
        border-radius: 12px;
        z-index: 999;
    `;

    button.addEventListener("click", async function () {
        var textArray = [];
        await recursiveDownload(document.body, textArray);

        var mergedText = textArray.join("\n\n");
        var blob = new Blob([mergedText], { type: "text/plain;charset=utf-8" });
        var url = URL.createObjectURL(blob);

        var link = document.createElement("a");
        link.download = 'merged_text.txt';
        link.href = url;
        link.click();
    });

    document.body.appendChild(button);
}

addButton();
