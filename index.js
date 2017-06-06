'use strict';

/*
WIKIPEDIA INTEGRATION
4) 'close' button
    -if possible: close open div when another headline clicked (accordion style)
5) big cities: don't include the state (ex: seattle) in the search url- how to determine?
*/

function init() {
    const endpoint = 'https://gist.githubusercontent.com/bradymwilliams/1c9c88421279868860a853e7e2b02d24/raw/07d04f9f215d5c42842d619f7289ffc808d1ce69/cities.json';
    const inputDiv = document.querySelector('#city-name');
    const inputWrapper = document.querySelector('#input-wrapper');
    const resultsDiv = document.querySelector('#results');
    const inputClearElement = document.getElementById('clear');
    const matchStatsElement = document.querySelector('#match-stats');
    let wikipediaApiBase = 'https://en.wikipedia.org/w/api.php?format=json&action=opensearch&origin=*&search=';
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

    const watchScroll = debounce(function() {
        const inputTop = inputWrapper.getBoundingClientRect().top;
        const windowTop = window.pageYOffset || document.documentElement.scrollTop;
        if(inputTop < 0) {
            inputWrapper.classList.add('sticky');
        }

        if(windowTop === 0 && inputWrapper.classList.contains('sticky')) {
            inputWrapper.classList.remove('sticky');
        }
    }, 200);

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


                let cityForId = result.city;
                let cityForLink = result.city;
                let stateForId = result.state.replace(/\'|\./gi, '');
                let stateForLink = result.state.replace(/\'|\./gi, '');
                const cityArray = result.city.split(' ');
                const stateArray = result.state.split(' ');

                if(cityArray.length > 1) {
                    cityForId = cityArray.join('-').replace('.', '');
                    cityForLink = cityArray.join('_')
                }
                if(stateArray.length > 1) {
                    stateForId = stateArray.join('-').replace(/\'|\./gi, '');
                    stateForLink = stateArray.join('_').replace(/\'|\./gi, '');
                }

                const myId = `${cityForId}-${stateForId}`;
                const linkHref = `${wikipediaApiBase}${cityForLink},${stateForLink}`;
                return `
                    <li>
                        <div class="li-flex" onclick="getWikiInfo('${linkHref}', '${myId}')">
                            <span>${cityName}, ${stateName}</span>
                            <span>${result.population}</span>
                        </div>
                        <div id="${myId}-wrapper" class="more-info">
                            <div id="${myId}">
                                <div style="text-align:center;">LOADING...</div>
                            </div>
                            <div id="${myId}-close" data-parent="${myId}" class="close">X</div>
                        </div>
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

        function numWithCommas(num) {
            let strArray = String(num).split('');
            let withCommas = [];

            var count = 0;
            for(let i = strArray.length - 1; i >= 0; i -= 1) {
                if(count === 3) {
                    withCommas.unshift(',');
                    count = 0;
                }
                withCommas.unshift(strArray[i]);
                count += 1;
            }
            return withCommas.join('');
        }

        matchStatsElement.innerHTML = `
            <li>Total Cities Found: ${data.length}</li>
            <li>Total Population: ${numWithCommas(totalPop)}</li>
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
        if(inputWrapper.classList.contains('sticky')) {
            inputWrapper.classList.remove('sticky');
        }
        notifyr({text: 'Results Cleared'});
    }, false);

    window.addEventListener('scroll', watchScroll);
}

function getWikiInfo(url, id) {
    const moreInfoWrapper = document.querySelector(`#${id}-wrapper`);
    const moreInfoClose = document.querySelector(`#${id}-close`);
    const moreInfo = document.querySelector(`#${id}`);

    moreInfoWrapper.classList.add('more-info--show');
    setTimeout(function() {
        moreInfoWrapper.classList.add('scale-up');
    }, 100); 

    fetch(url)
        .then(response => {
            if(response.ok) {
                return response.json();
            }
            throw new Error('Error contacting Wikipedia');
        })
        .then(jsonData => {
            const basicDescription = jsonData[2][0];
            const mainLink = jsonData[3][0];

            moreInfo.innerHTML = `
                <div>${basicDescription}</div>
                <div>
                    <a href="${mainLink}" target="_blank">More from Wikipedia</a>
                </div>
            `;
            moreInfoClose.addEventListener('click', closeDetails, false);
        })
        .catch(err => {
            notifyr({text: `${err}`});
        });
}

function closeDetails() {
    if(!this.dataset.parent) {
        notifyr({text: 'Error finding parent'});
        return;
    }

    const myParent = document.querySelector(`#${this.dataset.parent}-wrapper`);
    myParent.classList.remove('scale-up');
    setTimeout(function() {
        myParent.classList.remove('more-info--show');
    }, 400);
    this.removeEventListener('click', closeDetails);
}

function notifyr(options) {
    const text = options.text || 'Default Notice!';
    const timeout = options.timeout || 3000;

    const notifyrElement = document.createElement('div');
    notifyrElement.innerText = text;
    notifyrElement.style.cssText = 'font-size:1.25em;position:fixed;bottom:6px;right:6px;padding:1em;background-color:#333;color:#f5f5f5;transform:translateX(110%);transition:transform 0.3s ease';

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