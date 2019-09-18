//Author: Milos Paripovic

var useComma;
var useMM;
var useRounding;
var useMO;
var useGiga;
var useSpaces;
var useKelvin;
var isUK = false;
var lastquantity = 0;
var skips = 0;
var useBold;
var useBrackets;
var useMetricOnly;
var totalConversions;
var convertBracketed;
var matchIn;
var isparsing=false;

var fractions = {
	'¼': 0.25,
	'½': 0.5,
	'¾': 0.75,
	'⅐': 0.1428,
	'⅑': 0.111,
	'⅒': 0.1,
	'⅓': 0.333,
	'⅔': 0.667,
	'⅕': 0.2,
	'⅖': 0.4,
	'⅗': 0.6,
	'⅘': 0.8,
	'⅙': 0.167,
	'⅚': 0.8333,
	'⅛': 0.125,
	'⅜': 0.375,
	'⅝': 0.625,
	'⅞': 0.875
};

const regstart = '([\(]?';
const regend = '([^a-z]|$)';
const intOrFloat = '([0-9,\.]+)';
const intOrFloatSigned = '([\-−0-9,\.]+)';
const spc = '\u00A0';
const intOrFloatNoFrac = '([\.,0-9]+(?![\/⁄]))?';
const skipbrackets = '(?! [\(][0-9]|\u200B\u3010)';
const unitSuffix = '(?! [\(][0-9]| ?\u200B\u3010)([^a-z]|$)';
const unitSuffixIn = '(?! ?[\(\-−\u00A0]?[0-9]| ?\u200B\u3010)([^a-z²³]|$)';
const unitSuffixft = '(?! ?[\(\-−\u00A0]?[0-9]| ?\u200B\u3010)([^a-z²³]|$)';
const unitfrac = '[\-− \u00A0]?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[\/⁄][0-9]+)?';
const sqcu = '([\-− \u00A0]?(sq\.?|square|cu\.?|cubic))?';
const sq = '([\-− \u00A0]?(sq\.?|square))?';
const skipempty = '^(?:[ \n\t]+)?';

const units = [{
	regex: new RegExp(regstart + intOrFloatSigned + '[ \u00A0]?(°|º|deg(rees)?)[ \u00A0]?F(ahrenheits?)?' + unitSuffix + ')', 'ig'),
	unit: '°C',
	multiplier: 1
}, {
	regex: new RegExp(regstart + '([0-9]+)[ \u00A0]?degrees(?![ \u00A0]?F))' + unitSuffix, 'g'),
	unit: '°C',
	multiplier: 1
}, {
	//(?!in ) exclude... replaced with
	// (?:in )?  to exclude converting "born in 1948 in"
	//old regex: new RegExp('((?:in )?[a-z#$€£\(]?' + intOrFloatNoFrac + unitfrac + sqcu + '[-− \u00A0]?in(ch|ches|²|³)?' + unitSuffixIn + ')', 'ig'), 
	//added (?=[0-9]) otherwise it will match "it is in something"    
	regex: new RegExp('((?:in)?[a-z#$€£\(]?(?=[0-9¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])([\.,0-9]+(?![\/⁄]))?[-− \u00A0]?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[\/⁄][0-9]+)?([-− \u00A0]?(sq\.?|square|cu\.?|cubic))?[-− \u00A0]?(?:in(ch|ches|²|³)?)( [a-z]+)?'+unitSuffixIn+')', 'ig'),
	unit: 'cm',
	unit2: 'mm',
	multiplier: 2.54,
	multiplier2: 25.4,
	multipliercu: 0.0163871,
	fullround: true
}, {
    //([\(]?[°º]? ?([\.,0-9]+(?![\/⁄]))?[-− \u00A0]?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[\/⁄][0-9]+)?[-− \u00A0]?(\'|′|’)(?![\'′’])(?! ?[\(-\− \u00A0]?[0-9]| \u3010)([^a-z]|$))
	regex: new RegExp('([\(]?[°º]? ?' + intOrFloatNoFrac + unitfrac + '[\-− \u00A0]?(\'|′|’)(?![\'′’])' + unitSuffixft + ')', 'g'),
	unit: 'm',
	multiplier: 0.3048
}, {
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + sqcu + '[\-− \u00A0]?(feet|foot|ft)(²|³)?' + unitSuffixft + ')', 'ig'),
	unit: 'm',
	multiplier: 0.3048,
	multipliercu: 28.31690879986443
}, {
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + sq + '[ \u00A0]?(mi|miles?)(²|³)?' + unitSuffix + ')', 'ig'),
	unit: 'km',
	multiplier: 1.60934,
	fullround: true
}, {
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + sq + '[ \u00A0]?(yards?|yd)(²|³)?' + unitSuffix + ')', 'ig'),
	unit: 'm',
	multiplier: 0.9144
}, {
	regex: new RegExp(regstart + intOrFloat + '[ \u00A0]?mph' + unitSuffix + ')', 'ig'),
	unit: 'km\/h',
	multiplier: 1.60934,
	fullround: true,
	forceround: true
}, {
	regexUnit: new RegExp(skipempty + '(pound|lb)s?' + skipbrackets + regend, 'ig'),
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?(pound|lb)s?' + unitSuffix + ')', 'ig'),
	unit: 'kg',
	unit2: 'g',
	multiplier: 0.453592,
	multiplier2: 453.592,
	fullround: true
}, {
	regexUnit: new RegExp(skipempty + '(ounces?|oz)' + skipbrackets + regend, 'ig'),
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?(ounces?|oz)' + unitSuffix + ')', 'ig'),
	unit: 'g',
	multiplier: 28.3495,
	forceround: true
}, {
	regexUnit: new RegExp(skipempty + 'fl(uid)? ?(ounces?|oz)' + skipbrackets + regend, 'ig'),
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?fl(uid)? ?(ounces?|oz)' + unitSuffix + ')', 'ig'),
	unit: 'mL',
	multiplier: 29.5735,
	forceround: true,
	multiplierimp: 28.4131
}, {
	regexUnit: new RegExp(skipempty + 'gal(lons?)' + skipbrackets + regend, 'ig'),
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?gal(lons?)?' + unitSuffix + ')', 'ig'),
	unit: 'L',
	multiplier: 3.78541,
	multiplierimp: 4.54609
}, {
	regexUnit: new RegExp(skipempty + '^pints?' + skipbrackets + regend, 'ig'),
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?pints?' + unitSuffix + ')', 'ig'),
	unit: 'L',
	unit2: 'mL',
	multiplier: 0.473176,
	multiplier2: 473.176,
	fullround: true,
	multiplierimp: 0.568261
}, {
	regexUnit: new RegExp(skipempty + 'cups?'+skipbrackets + regend, 'ig'),
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[-− \u00A0\n]?cups?' + unitSuffix + ')', 'ig'),
	unit: 'mL',
	multiplier: 236.59,
	forceround: true,
	multiplierimp: 284.131
}, {
	regexUnit: new RegExp(skipempty + '(qt|quarts?)' + skipbrackets + regend, 'ig'),
	regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[-− \u00A0\n]?(qt|quarts?)' + unitSuffix + ')', 'ig'),
	unit: 'L',
	multiplier: 0.946353,
	multiplierimp: 1.13652
}, {
	regex: new RegExp(regstart + intOrFloat + '[ \u00A0]?stones?' + unitSuffix + ')', 'ig'),
	unit: 'kg',
	multiplier: 6.35029
}, {
	regex: new RegExp(regstart + intOrFloat + '[ \u00A0]?acres?' + unitSuffix + ')', 'ig'),
	unit: 'ha',
	multiplier: 0.4046856422
}, {
	regex: new RegExp(regstart + intOrFloat + '[ \u00A0]?horsepower?' + unitSuffix + ')', 'ig'),
	unit: 'kW',
	multiplier: 0.745699872
}];


function walk(node) {
	if (hasEditableNode(node)) return;

	let child;
	let next;

	switch (node.nodeType) {
		case 1: // Element
		case 9: // Document
		case 11: // Document fragment
			child = node.firstChild;
			while (child) {
				next = child.nextSibling;
				if (/SCRIPT|STYLE|IMG|NOSCRIPT|TEXTAREA|CODE/ig.test(child.nodeName) === false) {
					walk(child);
				}
				child = next;
			}
			break;
		case 3: // Text node
			procNode(node);
			break;
		default:
			break;
	}
}

function procNode(textNode) {

	let text = textNode.nodeValue;

	if (text.startsWith('{') || text.length<1) 
        return;

	//skipping added for quantity and unit in separate blocks - after the number is found, sometimes next node is just a bunch of whitespace, like in cooking.nytimes, so we try again on the next node
	if (lastquantity !== undefined && lastquantity !== 0 && skips < 2) {
		text = ParseUnitsOnly(text);        
		if (/^[a-zA-Z]+$/g.test(text))
			lastquantity = 0;
		else
			skips++;
	} else {        
		lastquantity = 0;
		if (text.length < 50) {
			let quantity = StringToNumber(text);
			lastquantity = quantity;
			skips = 0;
		}
	}
    text = AxAqq(text);
	text = feetInch(text);
	text = AxAxAin(text);
	text = AxAin(text);
	text = AxAft(text);
	text = ftin2m(text);
	text = lboz2kg(text);
	text = processAll(text);
	text = mpg2Lper100km(text);
	textNode.nodeValue = text;
}


function mpg2Lper100km(text) {

	let regex = new RegExp(regstart + intOrFloat + '[ \u00A0]?mpgs?' + unitSuffix + ')', 'ig');

	if (text.search(regex) !== -1) {
		let matches;

		while ((matches = regex.exec(text)) !== null) {
			try {
                //console.log(matches[0]);
                if (BracketsCheck(matches[0])) continue;
				const fullMatch = matches[1];
                
                for (var i=0; i<matches.length; i++)
			    //console.log("matches " + i + " " + matches[i])
				
				var imp = matches[2];
				if (imp !== undefined) {
					imp = imp.replace(',', '');
				}

				imp = parseFloat(imp);

				if (imp === 0 || isNaN(imp)) continue;
				var l = 235.214583 / imp; // 100 * 3.785411784 / 1.609344 * imp;   
				var met = convert(l, 1, false);
				//met = replaceWithComma(met);                

				const insertIndex = GetIndexPos(matches.index, fullMatch);				
				const metStr = prepareForOutput(met, '\u00A0L\/100\u00A0km', false);
				text = insertAt(text, metStr, insertIndex);
			} catch (err) {
				//console.log(err.message);
			}
		}
	}
	return text;
}

function GetIndexPos(index, fullMatch) {
    let insertIndex = index + fullMatch.length; 
    let lastchar = fullMatch[fullMatch.length -1];
    if (/[\s \.,;]/.test(lastchar)) 
        insertIndex--;
    return insertIndex;
}

function CleanReplace(text, match, metStr) {
    let lastchar = match[match.length -1];   
    //console.log("replacing " + match + " with " + metStr + /[^a-z"″”“’'′]/i.test(lastchar));
     
    //if (/[\s \.,;\)]/.test(lastchar)) 
    if (/[^a-z"″”“’'′]/i.test(lastchar)) 
        return text.replace(match, metStr + lastchar);
    else
        return text.replace(match, metStr);
}


function BracketsCheck(text){
    if ((convertBracketed && /[\(]/.test(text.substring(1))) ||
       (!convertBracketed && /[\(\)]/.test(text)) ||
       /\u3010/.test(text))
        return true;
    return false;
}

function processAll(text) {

	const len = units.length;
	for (let i = 0; i < len; i++) {
		if (text.search(units[i].regex) !== -1) {
			let matches;

			while ((matches = units[i].regex.exec(text)) !== null) {
				try {

					//includes a bracket, it is probably already converted. ex: 1 in (2.54 cm)
                   
					if (BracketsCheck(text)) continue;

					if ((matches[2] !== undefined) && (/(?:^|\s)([-−]?\d*\.?\d+|\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?!\S)/g.test(matches[2]) === false)) continue;

					let subtract = 0;
					if (i == 2) {
						//if (/[a-z#$€£]/i.test(matches[1].substring(0,1)))                      
						if (/^[a-z#$€£]/i.test(matches[0]))
							continue;
						if (/^in /i.test(matches[0])) //born in 1948 in ...
							continue;
                        if (!matchIn && / in /i.test(matches[0])) //born in 1948 in ...
							continue;
						if (matches[7] !== undefined) {
							if (hasNumber(matches[7])) continue; //for 1 in 2 somethings
							if (matches[7] == ' a') continue;
							if (matches[7] == ' an') continue;
							if (matches[7] == ' the') continue;
							if (matches[7] == ' my') continue;
							if (matches[7] == ' his') continue;
							if (matches[7] == '-') continue;
							if (/ her/.test(matches[7])) continue;
							if (/ their/.test(matches[7])) continue;
							if (/ our/.test(matches[7])) continue;
							if (/ your/.test(matches[7])) continue;
							subtract = matches[7].length;
						}
					}
					if (i == 3) {
						if (/[°º]/.test(matches[1])) continue;
						if (/\d/ig.test(matches[5])) continue; //avoid 3' 5"
					}
                    /*for (var it=0; it<matches.length; it++)
			         console.log("matches " + it + " " + matches[it]);
                    */  
					let suffix = '';

					//if (/[\(\)]/.test(matches[0])) continue;
                    
					const fullMatch = matches[1];
					var imp = matches[2];

					if (matches[2] !== undefined) {
						imp = imp.replace(',', '');

						if (/[⁄]/.test(matches[2])) { //improvisation, but otherwise 1⁄2 with register 1 as in
							matches[3] = matches[2];
							imp = 0;
						} else {
							imp = parseFloat(imp);
						}
					}
					//console.log("imp " + imp);
					if (isNaN(imp))
						imp = 0;
                    
                    if (i == 2 && / in /i.test(matches[0]) && imp > 1000)
							continue; //prevents 1960 in Germany

					if (matches[3] === '/') continue; // 2,438/sqft
					if (matches[3] !== undefined)
						imp += addFraction(matches[3]);
					//console.log("imp " + imp);

					if (imp === 0 || isNaN(imp)) continue;

					if (/²/.test(matches[1]))
						suffix = '²';
					else if (/³/.test(matches[1]))
						suffix = '³';
					else if (((typeof(matches[5]) !== 'undefined') && matches[5].toLowerCase().indexOf('sq') !== -1))
						suffix = '²';
					else if (((typeof(matches[5]) !== 'undefined') && matches[5].toLowerCase().indexOf('cu') !== -1))
						suffix = '³';
                    
                    
					const metStr = convAndForm(imp, i, suffix);

					let insertIndex = GetIndexPos(matches.index, fullMatch);	
					insertIndex = insertIndex - subtract; //subtracts behind bracket
					text = insertAt(text, metStr, insertIndex);

				} catch (err) {
					//console.log(err.message);
				}
			}
		}
	}

	return text;
}

function addFraction(frac) {
	if (fractions[frac] === undefined) {
		try {
			if (/[a-zA-Z,\?\!]/.test(frac)) 
                return 0;
			let cleanedFrac = frac.replace(/[^\d\/⁄]/, '');
			cleanedFrac = frac.replace(/[⁄]/, '\/');
			if (cleanedFrac.length < 3) 
                return 0;
			return eval(cleanedFrac);
		} catch (err) {
			return 0;
		}
	}
	return fractions[frac];
}

function convAndForm(imp, unitIndex, suffix) {
	let multiplier = units[unitIndex].multiplier;
	if (isUK === true && units[unitIndex].multiplierimp !== undefined)
		multiplier = units[unitIndex].multiplierimp;
	let unit = units[unitIndex].unit;
	if (useMM === true && units[unitIndex].multiplier2 !== undefined) {
		unit = units[unitIndex].unit2;
		multiplier = units[unitIndex].multiplier2;
	}
	const round = (useRounding === false &&
		((useMM === true && units[unitIndex].multiplier2 !== undefined && units[unitIndex].fullround) || units[unitIndex].forceround));

	var met;
	if (unitIndex < 2 ) {
		met = convertToC(imp);
		if (useKelvin) {
			met += 273.15;
			met = roundNicely(met);
			unit = 'K';
		}
	} else if (suffix === '²')
		met = convert(imp, Math.pow(multiplier, 2), round);
	else if (suffix === '³') {
		met = convert(imp, units[unitIndex].multipliercu, round);
		unit = 'L';
		suffix = '';
	} else {
		met = convert(imp, multiplier, round);
		let r = stepUpOrDown(met, unit);

		met = roundNicely(r.met);
		unit = r.unit;
	}

	if (met === 100 && unit === 'cm' && useMM === false) {
		met = 1;
		unit = 'm';

	} else if (met === 1000 && unit === 'mm' && useMM === true) {
		met = 1;
		unit = 'm';
	}
	
	return prepareForOutput(met, spc + unit + suffix, false);
}

function convert(imp, multiplier, round) {
	let met = imp * multiplier;
	if (round === true)
		return Math.round(met);
	return roundNicely(met);
}

function stepUpOrDown(met, unit) {
	if (met < 1) {
		switch (unit) {
			case 'cm':
				met = met * 10;
				unit = "mm";
				break;
			case 'm':
				if (useMM === true) {
					met = met * 1000;
					unit = "mm";
				} else {
					met = met * 100;
					unit = "cm";
				}
				break;
			case 'km':
				met = met * 1000;
				unit = "m";
				break;
			case 'kg':
				met = met * 1000;
				unit = "g";
				break;
			case 'L':
				met = met * 1000;
				unit = "mL";
				break;
		}
	} else if (met > 10000) {
		if (useGiga) {
			if (met > 100000000) {
				switch (unit) {
					case 'm':
						met = met / 1000000000;
						unit = "Gm";
						break;
					case 'g':
						met = met / 1000000000;
						unit = "Gg";
						break;
					case 'L':
						met = met / 1000000000;
						unit = "GL";
						break;
					case 'km':
						met = met / 1000000;
						unit = "Gm";
						break;
					case 'kg':
						met = met / 1000000;
						unit = "Gg";
						break;
				}
			}
			if (met > 100000) {
				switch (unit) {
					case 'm':
						met = met / 1000000;
						unit = "Mm";
						break;
					case 'g':
						met = met / 1000000;
						unit = "Mg";
						break;
					case 'L':
						met = met / 1000000;
						unit = "ML";
						break;
					case 'km':
						met = met / 1000;
						unit = "Mm";
						break;
					case 'kg':
						met = met / 1000;
						unit = "Mg";
						break;
					case 'kL':
						met = met / 1000;
						unit = "ML";
						break;
				}
			}
			if (met > 1000) {
				if (unit === 'L') {
					met = met / 1000;
					unit = "KL";

				}
			}
		}

		switch (unit) {
			case 'mm':
				if (useMM === true) {
					met = met / 1000;
					unit = "m";
				} else {
					met = met / 100;
					unit = "cm";
				}
				break;
			case 'cm':
				met = met / 100;
				unit = "m";
				break;
			case 'm':
				met = met / 1000;
				unit = "km";
				break;
			case 'g':
				met = met / 1000;
				unit = "kg";
				break;
			case 'mL':
				met = met / 1000;
				unit = "L";
				break;
		}
	}


	return {
		met: met,
		unit: unit
	};
}

function roundNicely(v) {
	if (useRounding === false)
		return Math.round(v * 100) / 100;

	var dec0 = Math.round(v);

	if (Math.abs((1 - (v / dec0)) * 100) < 3) return dec0;
	var dec1 = Math.round(v * 10) / 10;

	if (Math.abs((1 - (v / dec1)) * 100) < 1.6) return dec1;
	var dec2 = Math.round(v * 100) / 100;

	return dec2;
}

function convertToC(f) {
	let met = (5 / 9) * (f - 32);
	return Math.round(met);
}


function insertAt(target, toInsert, index) {
	return target.substr(0, index) + toInsert + target.substr(index);
}

//1 x 2 x 3
function AxAxAin(text) {

	let regex = new RegExp('[\(]?(([0-9]+(\.[0-9]+)?)[ \u00A0]?[x|\*][ \u00A0]?([0-9]+(\.[0-9]+)?)[ \u00A0]?[x|\*][ \u00A0]?([0-9]+(\.[0-9]+)?)[ \u00A0]?in(ch|ches|.)?)' + unitSuffix, 'ig');

	if (text.search(regex) !== -1) {
		let matches;

		while ((matches = regex.exec(text)) !== null) {
			try {
				const fullMatch = matches[1];
                if (BracketsCheck(text)) continue;
                
				let scale = 2.54;
				let unit = spc + "cm";
				if (useMM === true) {
					scale = 25.4;
					unit = spc + "mm"
				}
				let cm1 = replaceWithComma(roundNicely(matches[2] * scale));
				let cm2 = replaceWithComma(roundNicely(matches[4] * scale));
				let cm3 = replaceWithComma(roundNicely(matches[6] * scale));


				const insertIndex = GetIndexPos(matches.index, fullMatch);	
				const metStr = prepareForOutput(cm1 + spc + "×" + spc + cm2 + spc + "×" + spc + cm3, spc + unit, true);				

				//text = text.replace(matches[0], metStr);
                text = CleanReplace(text, matches[0], metStr);
			} catch (err) {
				//console.log(err.message);
			}
		}
	}
	return text;
}

function AxAqq(text) {//ikea US


	let regex = new RegExp('((?<!\/)(([0-9]+(?!\/))[\-− \u00A0]([0-9]+[\/⁄][0-9\.]+)?) ?[x|\*|×] ?(([0-9]+(?!\/))?[\-− \u00A0]([0-9]+[\/⁄][0-9\.]+)?)? ?("|″|”|“|’’|\'\'|′′)([^a-z]|$))', 'ig');
//new ((([\.0-9]+(?!\/)(\.[0-9]+)?)?[\-− \u00A0]([0-9]+[\/⁄][0-9\.]+)?)? ?("|″|”|“|’’|\'\'|′′)([^a-z]|$)))
	let matches;


	while ((matches = regex.exec(text)) !== null) {
		try {
/*
			for (var i=0; i<matches.length; i++)
			    console.log("matches " + i + " " + matches[i])*/
			const fullMatch = matches[1];
            //if (BracketsCheck(text)) continue;


			let inches1 = parseFloat(matches[3]);
			if (isNaN(inches1)) inches1 = 0;

			let frac1 = (matches[4]);
			frac1 = addFraction(frac1);
			if (isNaN(frac1)) continue;
                        
            let inches2 = parseFloat(matches[6]);
			if (isNaN(inches2)) inches2 = 0;

			let frac2 = (matches[7]);
			frac2 = addFraction(frac2);
			if (isNaN(frac2)) continue;
            
            //console.log( inches1 + " " + frac1 + " " + inches2 + " " + frac2);
			
            inches1 = inches1+frac1;
            inches2 = inches2+frac2;
            
            let scale = 2.54;
            let unit = spc + "cm";
            if (useMM === true) {
                scale = 25.4;
                unit = spc + "mm"
            }
            
			let cm1 = replaceWithComma(roundNicely(inches1 * scale));
			let cm2 = replaceWithComma(roundNicely(inches2 * scale));


            const insertIndex = GetIndexPos(matches.index, fullMatch);	
            const metStr = prepareForOutput(cm1 + spc + "×" + spc + cm2, spc + unit, true);				

            //text = text.replace(matches[0], metStr);
            text = CleanReplace(text, matches[0], metStr);
		} catch (err) {
			console.log(err.message);
		}
	}
	return text;


}

// 1 x 2 in
function AxAin(text) {

	let regex = new RegExp('[\(]?(([0-9]+(\.[0-9]+)?)[-− \u00A0]?[x|\*|×][-− \u00A0]?([0-9]+(\.[0-9]+)?)[-− \u00A0]?in(ch|ches|\.)?)' + unitSuffix, 'ig');

	if (text.search(regex) !== -1) {
		let matches;

		while ((matches = regex.exec(text)) !== null) {
			try {

				const fullMatch = matches[1];
				if (/[0-9][X|x|\*|×][ \u00A0][0-9]/.test(fullMatch))
					continue; //it is 2x 2in something so no conversion                
				if (BracketsCheck(text)) continue;

				let scale = 2.54;
				let unit = spc + "cm";
				if (useMM === true) {
					scale = 25.4;
					unit = spc + "mm"
				}
				let cm1 = replaceWithComma(roundNicely(matches[2] * scale));
				let cm2 = replaceWithComma(roundNicely(matches[4] * scale));

				const insertIndex = GetIndexPos(matches.index, fullMatch);					
				const metStr = prepareForOutput(cm1 + spc + "x" + spc + cm2, spc + unit, true); //+ behind bracket

				//text = text.replace(matches[0], metStr);
                text = CleanReplace(text, matches[0], metStr);
			} catch (err) {
				//console.log(err.message);
			}
		}
	}
	return text;
}

// 1 x 2 ft
// 1' x 2'
function AxAft(text) {

	let regex = new RegExp('[\(]?(([0-9]+(\.[0-9]+)?)[\'′’]?[-− \u00A0]?[x|\*|×][-− \u00A0]?([0-9]+(\.[0-9]+)?)[-− \u00A0]?(feet|foot|ft|[\'′’]))' + unitSuffix, 'ig');

	if (text.search(regex) !== -1) {
		let matches;

		while ((matches = regex.exec(text)) !== null) {
			try {
				const fullMatch = matches[1];
				if (/[0-9][x|X|\*|×][ \u00A0][0-9]/.test(fullMatch))
					continue; //it is 2x 2ft something so no conversion    
				if (BracketsCheck(text)) continue;

				let scale = 0.3048;
				let unit = spc + "m";

				let m1 = replaceWithComma(roundNicely(matches[2] * scale));
				let m2 = replaceWithComma(roundNicely(matches[4] * scale));

				const insertIndex = GetIndexPos(matches.index, fullMatch);	
				const metStr = prepareForOutput(m1 + spc + "×" + spc + m2, spc + unit, true);
				
				//text = text.replace(matches[0], metStr);
                text = CleanReplace(text, matches[0], metStr);
			} catch (err) {
				//console.log(err.message);
			}
		}
	}
	return text;
}


function hasNumber(myString) {
	return /\d/.test(myString);
}


//1' 2"
function feetInch(text) {

	let regex = new RegExp('([°|º]? ?(([0-9]{0,3})[\'’′][\-− \u00A0]?)?(([\.0-9]+(?!\/)(\.[0-9]+)?)?[\-− \u00A0]?([^ a-z,\?\.\!]|[0-9]+[\/⁄][0-9\.]+)?)? ?("|″|”|“|’’|\'\'|′′)'+unitSuffix+')', 'g');
//new ((([\.0-9]+(?!\/)(\.[0-9]+)?)?[\-− \u00A0]([0-9]+[\/⁄][0-9\.]+)?)? ?("|″|”|“|’’|\'\'|′′)([^a-z]|$)))
	let matches;

	let lastQuoteOpen = false;
	while ((matches = regex.exec(text)) !== null) {
		try {

			//for (var i=0; i<matches.length; i++)
			//    console.log("matches " + i + " " + matches[i])
			const fullMatch = matches[1];
            if (BracketsCheck(text)) continue;

			if (/“/.test(fullMatch)) {
				lastQuoteOpen = true;
				continue;
			}

			if (!hasNumber(fullMatch) && !/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/.test(fullMatch) && /[\"\″]/.test(fullMatch)) {
				lastQuoteOpen = !lastQuoteOpen;
				continue;
			}
			if (lastQuoteOpen === true) {
				lastQuoteOpen = false;
				continue;
			}

			if (/[\(]/.test(matches[9])) continue;
			if (/[°|º]/.test(fullMatch)) {
				continue;
			}

			let feet = parseFloat(matches[3]);
			if (isNaN(feet)) feet = 0;

			let inches = (matches[5]);
			if (/[⁄]/.test(matches[5])) { //improvisation, but otherwise 1⁄2 with register 1 as in
				matches[7] = matches[5];
				inches = 0;
			} else {
				inches = parseFloat(inches);
				if (isNaN(inches)) inches = 0;
			}

			if (matches[7] !== undefined)
				inches += addFraction(matches[7]);

			if (inches === 0 || isNaN(inches)) continue;

			let total = feet + (inches / 12);

			let metStr = '';
			if (total > 3)
				metStr = convAndForm(feet + inches / 12, 3, ''); //3 feet
			else
				metStr = convAndForm(feet * 12 + inches, 2, ''); //2 inch
			const insertIndex = GetIndexPos(matches.index, fullMatch);	

			text = insertAt(text, metStr, insertIndex);

		} catch (err) {
			console.log(err.message);
		}
	}
	return text;
}

//1 ft 2 in 
function ftin2m(text) {
	let regex = new RegExp('(([0-9]{0,3}).?(ft|yd|foot|feet).?([0-9]+(\.[0-9]+)?).?in(ch|ches)?)', 'g');
	if (text.search(regex) !== -1) {
		let matches;

		while ((matches = regex.exec(text)) !== null) {
			try {
				const original = matches[0];
				let ydft = matches[2];
				ydft = parseFloat(ydft);
				let inches = matches[4];
				inches = parseFloat(inches);

				let total = 0;
				var isyd = new RegExp('yd', 'i');
				if (isyd.test(matches[3])) ydft *= 3;

				total = ydft * 12 + inches;

				let meter = prepareForOutput(roundNicely(total * 0.0254), spc + 'm', true);

				//text = text.replace(matches[0], meter);
                text = CleanReplace(text, matches[0], meter);
			} catch (err) {
				// console.log(err.message);
			}
		}
	}
	return text;
}

// 1 lb 2 oz
function lboz2kg(text) {
	let regex = new RegExp('(([0-9]{0,3}).?(lbs?).?([0-9]+(\.[0-9]+)?).?oz)', 'g');
	if (text.search(regex) !== -1) {
		let matches;

		while ((matches = regex.exec(text)) !== null) {
			try {
				const original = matches[0];
				let lb = matches[2];
				lb = parseFloat(lb);
				let oz = matches[4];
				oz = parseFloat(oz);

				let total = 0;

				total = lb * 16 + oz;

				let kg = prepareForOutput(roundNicely(total * 0.0283495), spc + 'kg', true);
				//text = text.replace(matches[0], kg);
                text = CleanReplace(text, matches[0], kg);
			} catch (err) {
				// console.log(err.message);
			}
		}
	}
	return text;
}

function StringToNumber(text) {
	let regex = new RegExp('^(?![a-z])(?:[ \n\t]+)?([\.,0-9]+(?![\/⁄]))?(?:[-\− \u00A0])?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[\/⁄][0-9]+)?(?:[ \n\t]+)?$', 'ig');
	//console.log("try"+text+"s");

	let matches;

	while ((matches = regex.exec(text)) !== null) {
		try {
			if (matches[1] === undefined && matches[2] === undefined)
				continue;
			let imp = matches[1]; //.replace(',','');  
			//console.log("found:"+matches[1]);
			if (matches[1] !== undefined) {
				imp = imp.replace(',', '');

				if (/[⁄]/.test(matches[1])) { //improvisation, but otherwise 1⁄2 with register 1 as in
					matches[2] = matches[1];
					imp = 0;
				} else {
					imp = parseFloat(imp);
				}
			}
			//console.log("imp " + imp);
			if (isNaN(imp))
				imp = 0;

			if (matches[2] !== undefined)
				imp += addFraction(matches[2]);
			//console.log("imp2 " + imp);

			if (imp === 0 || isNaN(imp)) continue;
			return imp;
		} catch {
			//console.log(err.message);            
		}
	}
}


function ParseUnitsOnly(text) {
	//console.log("now trying " + text);
	const len = units.length;
	for (let i = 0; i < len; i++) {
		if (units[i].regexUnit === undefined)
			continue;
		let matches;

		while ((matches = units[i].regexUnit.exec(text)) !== null) {
			try {

				const metStr = convAndForm(lastquantity, i, "");
				const fullMatch = matches[0];
				const insertIndex = GetIndexPos(matches.index, fullMatch);	

				text = insertAt(text, metStr, insertIndex);

			} catch (err) {
				//console.log(err.message);
			}
		}

	}

	return text;
}

function bold(text) {
	if (useBold === false) return text;
    if (useBrackets === false) return text;
	let out = text.replace(/\d/g, (c) => String.fromCodePoint(0x1D7EC - 48 + c.charCodeAt(0)));
	out = out.replace(/[a-z]/g, (c) => String.fromCodePoint(0x1D5EE - 97 + c.charCodeAt(0)));
	out = out.replace(/[A-Z]/g, (c) => String.fromCodePoint(0x1D5D4 - 65 + c.charCodeAt(0)));
	//out = out.replace(/[,]/g, '\uff0c,');

	return out;
}

function addBrackets(text) {
	if (useBrackets)
		return "\u200B\u3010" + text + "\u3011"; //\200B is zero breaking space, so the unit is not in the next line
	else
		return " (" + text + ")˜";
}

function prepareForOutput(number, rest, commaReplaced) {
    totalConversions++;   
	if (commaReplaced === false)
		number = replaceWithComma(number)
	if (rest === undefined)
		rest = '';
	let fullstring = number + rest;
    fullstring = addBrackets(fullstring);
	fullstring = bold(fullstring);	
	return fullstring;
}

function replaceWithComma(mystring) {
	if (useComma === false) {
		if (useSpaces === true)
			return mystring.toLocaleString('us-EN').replace(',', '\u00A0');
		else
			return mystring.toLocaleString('us-EN');
	}

	if (useSpaces === true)
		return mystring.toLocaleString('de-DE').replace('.', '\u00A0');
	else
		return mystring.toLocaleString('de-DE');

}
        
function FlashMessage() {   
    var div  = document.getElementById("EverythingMetricExtension"); 
    if (div===null)
        div = document.createElement('div');
    div.setAttribute("id", "EverythingMetricExtension");
    div.textContent = 'Converted to Metric!';
    
    document.body.appendChild(div);
    var x = document.getElementById("EverythingMetricExtension");
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 1500);
}


document.addEventListener('DOMContentLoaded', function() {

	if (/docs\.google\./.test(window.location.toString()) ||
		/drive\.google\./.test(window.location.toString()) ||
		/mail\.google\./.test(window.location.toString())) {
		console.log("Everything Metric extension is disabled on Google Docs and Mail to prevent unintentional edits");
		return;
	}
	if (/medium\.com/.test(window.location.toString()) &&
		/\/edit/.test(window.location.toString())) {
		console.log("Everything Metric extension is disabled on medium.com/.../edit");
		return;
	}

	chrome.runtime.sendMessage({
			message: "Is metric enabled"
		},
		function(response) {
			useComma = response.useComma;
			useMM = response.useMM;
			useRounding = response.useRounding;
			useMO = response.useMO;
			useGiga = response.useGiga;
			useSpaces = response.useSpaces;
			useKelvin = response.useKelvin;
			useBold = response.useBold;
			useBrackets = response.useBrackets;
			useMetricOnly = response.useMetricOnly;
            convertBracketed = response.convertBracketed;
            matchIn = response.matchIn;

			if (response.metricIsEnabled === true) {
				let isamazon = false;
				if (/\.amazon\./.test(window.location.toString())) isamazon = true;
				if (/\.uk\//.test(window.location.toString())) isUK = true;
                if (isamazon) {
                    var div = document.getElementById("MetricAmazonHelper"); 
                    if (div===null)
                        div = document.createElement('div');
                    else
                        return;
                    div.setAttribute("id", "EverythingMetricExtension");
                    div.textContent = 'Converted to Metric!';    
                    document.body.appendChild(div);
                }
                isparsing=true;
				walk(document.body);
                isparsing=false;
				if (useMO === true || isamazon === true)
					initMO(document.body);
			}
		}
	); 
    
}, false);
/*
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.args === "parse_page_now") {
        alert('asdf');
        walk(document.body);
        FlashMessage();
    }
    sendResponse();
});
        
*/
        
        
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    
    if (request.command == "parse_page_now") {
        if (isparsing===true)
            return;
        isparsing=true;
        walk(document.body);
        isparsing=false;
        FlashMessage();
    }
});

function hasParentEditableNode(el) {
	if (hasEditableNode(el)) return true;
	while (el.parentNode) {
		el = el.parentNode;

		if (hasEditableNode(el)) 
            return true;
	}
	return false;
}

function hasEditableNode(el) {
	try {
		var namedNodeMap = el.attributes;

		for (var i = 0; i < namedNodeMap.length; i++) {
			var attr = namedNodeMap.item(i);
			if (attr.name === "contenteditable") {

				return true;
			} else if (attr.name === "class" && attr.value === "notranslate") {

				return true;
			} else if (attr.name === "translate" && attr.value === "no") {

				return true;
			} else if (attr.name === "role" && attr.value === "textbox") {

				return true;
			}
		}
	} catch (error) {}
	return false;
}

function initMO(root) {

	MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

	var observer = new MutationObserver(function(mutations, observer) {
		//fired when a mutation occurs
		//console.log(mutations);
		//var t0 = performance.now();
		for (var i = 0; i < mutations.length; i++) {
			for (var j = 0; j < mutations[i].addedNodes.length; j++) {
				//checkNode(mutations[i].addedNodes[j]);
				//console.log(mutations[i].addedNodes[j]);
				if (!hasParentEditableNode(mutations[i].addedNodes[j]))
					walk(mutations[i].addedNodes[j]);

				//var t1 = performance.now();
				//nmut++;
				//console.log(nmut + " Call to mutations took " + (t1 - t0) + " milliseconds.")
			}
		}
	});
	var opts = {
		characterData: false,
		childList: true,
		subtree: true
	};
	var observe = function() {
		observer.takeRecords();
		observer.observe(root, opts);
	};
	observe();
}