// ==UserScript==
// @name         Ficbook Comments Downloader
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Скачивает комментарии к главе Ficbook в HTML-файл
// @author       TheScriptComp, Gemini 3.5 Pro
// @match        https://ficbook.net/readfic/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Кнопка скачивания отзывов
    const btn = document.createElement('button');
    btn.innerHTML = '⬇ Скачать отзывы';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 99999;
        background-color: #fff;
        border: 1px solid #d1d5da;
        border-radius: 6px;
        padding: 10px 15px;
        font-size: 14px;
        font-family: Arial, sans-serif;
        color: #24292e;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.15);
        font-weight: bold;
        transition: background-color 0.2s;
    `;

    btn.onmouseover = () => btn.style.backgroundColor = '#f4f6f9';
    btn.onmouseout = () => btn.style.backgroundColor = '#fff';

    document.body.appendChild(btn);

    // 2. Сбор данных
    btn.addEventListener('click', () => {
        const authorEl = document.querySelector('.creator-username');
        const ficAuthor = authorEl ? authorEl.textContent.trim() : '';

        const titleEl = document.querySelector('h2[itemprop="headline"]');
        const chapterTitle = titleEl ? titleEl.textContent.trim() : 'Отзывы к главе';

        const comments = document.querySelectorAll('article.comment-container');
        let commentsHtml = '';

        comments.forEach(el => {
            // Имя
            const nameEl = el.querySelector('.js-comment-author');
            let name = nameEl ? nameEl.textContent.trim() : 'Аноним';
            if (el.querySelector('.comment-badge')) {
                name += ' 👑';
            }

            // Дата
            const dateEl = el.querySelector('time.comment-date');
            const date = dateEl ? dateEl.textContent.trim() : '';

            // Лайки
            const likeList = el.querySelector('.like-list');
            let likedByAuthor = false;
            if (ficAuthor && likeList) {
                likeList.querySelectorAll('img').forEach(img => {
                    if (img.alt.trim() === ficAuthor) {
                        likedByAuthor = true;
                    }
                });
            }

            let likesCount = '0';
            const likesBtn = el.querySelector('.comment-like .text-bold');
            if (likesBtn) {
                likesCount = likesBtn.textContent.trim();
            }

            // Текст
            const msgEl = el.querySelector('.comment-message');
            let textHtml = '';
            if (msgEl) {
                const clone = msgEl.cloneNode(true);

                // Убираем SVG-иконки
                clone.querySelectorAll('svg').forEach(s => s.remove());

                // Меняем вложенные div.quoted на классические blockquote
                let quoteDiv = clone.querySelector('div.quoted');
                while (quoteDiv) {
                    const bq = document.createElement('blockquote');
                    while (quoteDiv.firstChild) {
                        bq.appendChild(quoteDiv.firstChild);
                    }
                    quoteDiv.replaceWith(bq);
                    quoteDiv = clone.querySelector('div.quoted');
                }

                // Разбиваем по всем видам переносов, режем левые пробелы и собираем обратно
                textHtml = clone.innerHTML
                    .split(/\r?\n/)
                    .map(line => line.trimStart())
                    .join('\n')
                    .trim();
            }

            // ВАЖНО: <div class="text">${textHtml}</div> записано в одну строку без отступов!
            commentsHtml += `
        <div class="comment">
            <div class="comment-header">
                <span class="author">${name}</span>
                <span class="date">${date}</span>
            </div>
            <div class="text">${textHtml}</div>
            <div class="footer">
                <span class="likes">${likesCount}👍</span>
                ${likedByAuthor ? '<span class="author-like">Понравилось автору</span>' : ''}
            </div>
        </div>`;
        });

        // 3. Формируем итоговый HTML
        const fullHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chapterTitle} - Отзывы</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f6f9;
            color: #333;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .comments-container {
            max-width: 800px;
            margin: 0 auto;
        }
        .comment {
            background-color: #fff;
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .comment-header {
            margin-bottom: 10px;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 8px;
        }
        .author {
            font-weight: bold;
            color: #2c3e50;
            font-size: 1.1em;
        }
        .date {
            font-style: italic;
            color: #7f8c8d;
            font-size: 0.85em;
            margin-left: 10px;
        }
        .text {
            margin-bottom: 15px;
            color: #444;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        blockquote {
            background-color: #f8f9fa;
            border-left: 4px solid #adb5bd;
            margin: 10px 0;
            padding: 8px 12px;
            color: #555;
            border-radius: 0 4px 4px 0;
            white-space: pre-wrap;
        }
        .footer {
            font-size: 0.95em;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .likes {
            font-weight: bold;
            color: #e67e22;
        }
        .author-like {
            color: #27ae60;
            font-weight: bold;
            background: #e8f8f5;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.85em;
        }
    </style>
</head>
<body>
    <div class="comments-container">
${commentsHtml}
    </div>
</body>
</html>`;

        // 4. Скачиваем
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Отзывы - ${chapterTitle.replace(/[\\/:*?"<>|]/g, '')}.html`;
        a.click();
        URL.revokeObjectURL(url);
    });
})();
