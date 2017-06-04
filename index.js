'use strict';
/*
TODO
    1) fix capitalization issue on search results
    5) animate in each individually?
*/

function init() {
    const endpoint = 'https://gist.githubusercontent.com/bradymwilliams/1c9c88421279868860a853e7e2b02d24/raw/07d04f9f215d5c42842d619f7289ffc808d1ce69/cities.json';
    const inputDiv = document.querySelector('#city-name');
    const resultsDiv = document.querySelector('#results');
    const inputClearElement = document.getElementById('clear');
    const matchStatsElement = document.querySelector('#match-stats');
    let fetchedData;

    const data = fetch(endpoint);
    data.then(response => {
        if(response.ok) {
            return response.json();
        }
        throw new Error('Fetch endpoint not found');
    }).then(jsonData => {
        fetchedData = [...jsonData];
        notifyr({text: 'Data Loaded!', timeout: 5000});
    }).catch(error => {
        console.log(error);
    });

    const handleInput = debounce(function() {
        const regex = new RegExp(this.value, 'gi');

        const displayData = fetchedData
            .filter(result => {
                if(this.value !== '') {
                    return result.city.match(regex) || result.state.match(regex);
                }
            });
        
        if(this.value === '') {
            resultsDiv.innerHTML = '';
            inputClearElement.style.opacity = 0;
            setMatchStats([]);
            return;
        }

        setMatchStats(displayData);

        if(displayData.length === 0) {
            resultsDiv.innerHTML = '<li>No matches found!</li>';
            inputClearElement.style.opacity = 1;
            return;
        }

        resultsDiv.innerHTML = displayData
            .map(result => {
                if(result === 'none') {
                    return `<li>No matches found!</li>`;
                }
                const cityName = highlight(result.city, this.value);
                const stateName = highlight(result.state, this.value);
                return `
                    <li>
                        <span>${cityName}, ${stateName}</span>
                        <span>${result.population}</span>
                    </li>
                `;
            }).join('');
        inputClearElement.style.opacity = 1;
    }, 250);

    function highlight(text, word) {
        const rg = new RegExp(word, 'gi');
        return text.replace(rg, `<span class="hl">${word}</span>`);
    }

    function setMatchStats(data) {
        if(data.length === 0) {
            matchStatsElement.innerHTML = '';
            return;
        }

        const totalPop = data.reduce((prev, current) => {
            return prev + commasToNum(current.population);
        }, 0);

        function commasToNum(str) {
            return Number(str.replace(/\,/gi, ''));
        }

        matchStatsElement.innerHTML = `
            <li>Total Cities Found: ${data.length}</li>
            <li>Total Population: ${totalPop}</li>
        `;
    }

    function debounce(fx, delay) {
        let timer;

        return function() {
            const context = this;
            const args = arguments;

            const later = function() {
                timer = null;
                fx.apply(context, args);
            }

            clearTimeout(timer);
            timer = setTimeout(later, delay);

            if(!timer) {
                fx.apply(context, args);
            }
        }
    }

    inputDiv.addEventListener('keyup', handleInput, false);
    inputClearElement.addEventListener('click', function() {
        inputClearElement.style.opacity = 0;
        inputDiv.value = '';
        inputDiv.focus();
        resultsDiv.innerHTML = '';
        setMatchStats([]);
        notifyr({text: 'Results Cleared'});
    }, false);
}

function notifyr(options) {
    const text = options.text || 'Default Notice!';
    const timeout = options.timeout || 3000;

    const notifyrElement = document.createElement('div');
    notifyrElement.innerText = text;
    notifyrElement.style.cssText = 'position:fixed;bottom:6px;right:6px;padding:6px;background-color:#333;color:#f5f5f5;transform:translateX(110%);transition:transform 0.3s ease';

    document.body.appendChild(notifyrElement);

    setTimeout(function() {
        notifyrElement.style.transform = 'translateX(0)';
    }, 300);

    setTimeout(function() {
        notifyrElement.style.transform = 'translateX(110%)';
    }, timeout);

    setTimeout(function() {
        document.body.removeChild(notifyrElement);
    }, timeout + 1000);
}

document.addEventListener('DOMContentLoaded', init, false);