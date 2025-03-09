/*
 * Alt+Up -- extension for Chrome/Chromium browser
 * Copyright (C) 2010-13 Przemyslaw Pawelczyk <przemoc@gmail.com>
 * Copyright (C) 2014 Daniel Forssten <skoskav@gmail.com>
 * Copyright (C) 2025 Günther Bosch <guebosch@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 */

const URL_MATCH = /^([a-z]+:)\/\/([^/]*)\/?(.*)$/i;

const RULES = [
	{ part: 'path', patt: /([^/#]*)#.*$/   },
	{ part: 'path', patt: /([^/?]*)[?].*$/ },
	{ part: 'path', patt: /()[^/]*[/]?$/   },
	{ part: 'host', patt: /^[^.]+\.([^.]+(\.[^.]+)+)$/ }
];

function AltUpEngine()
{
	const splitUrl = function(url) {
		const match = URL_MATCH.exec(url);
		return {
			prot: match[1],
			host: match[2],
			path: match[3]
		};
	}

	const setUrl = function(tabId, url) {
		chrome.tabs.update(tabId, { 'url': url });
	}

	const goUpDestination = function(tab, max, filters) {
		let destination = '';
		const url = splitUrl(tab.url);
		let foundAnotherDestination = true;

		const filteredRules = RULES.filter(function(rule) {
			if (!filters.length)  // No filters means that all rules will be used
				return true;
			return filters.indexOf(rule.part) != -1;  // Use rule if it's a filter
		});

		// Go up either "max" amount of levels, or all if "max" is negative
		while (max > 0 || (max < 0 && foundAnotherDestination)) {
			max--;

			const origUrl = {
				prot: url.prot,
				host: url.host,
				path: url.path
			};

			// Add the result of the first matched rule
			foundAnotherDestination = filteredRules.some(function(rule) {
				url[rule.part] = url[rule.part].replace(rule.patt, '$1');
				if (url[rule.part] != origUrl[rule.part]) {
					destination = url.prot + '//' + url.host + '/' + url.path;
					return true;
				}
				return false;
			});
		}
		return destination;
	}

	const goUp = function(tab, levels, filters) {
		const destination = goUpDestination(tab, levels, filters);
		if (destination.length)
			setUrl(tab.id, destination);
	}

	const init = function() {
		chrome.commands.onCommand.addListener(function(command) {
			const matches = /^up:(-?\d+):?([\w,]*)?$/.exec(command);
			if (matches) {
				const levels = parseInt(matches[1]);
				const filters = (matches.length == 3 && typeof matches[2] !== 'undefined') ? matches[2].split(',') : [];

				chrome.tabs.query({'active': true, 'currentWindow': true}, function(tabs) {
					if (tabs && tabs.length > 0) {
						goUp(tabs[0], levels, filters);
					}
				});
			}
		});
	}

	init();
};

const engine = new AltUpEngine();
