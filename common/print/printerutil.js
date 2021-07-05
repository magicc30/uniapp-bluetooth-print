// 打印机纸宽72mm，页的宽度477，字符宽度为1，每行最多盛放32个字符
const PAGE_WIDTH = 477;
const MAX_CHAR_COUNT_EACH_LINE = 48;

/**
 * @param str
 * @returns {boolean} str是否全是中文
 */
function isChinese(str) {
	if(str==='（'||str==='）'){
		return true
	}else{
		return /^[\u4e00-\u9fa5]$/.test(str);
	}
}

/**
 * 返回字符串宽度(1个中文=2个英文字符)
 * @param str
 * @returns {number}
 */
function getStringWidth(str) {
	let width = 0;
	for (let i = 0, len = str.length; i < len; i++) {
		width += isChinese(str.charAt(i)) ? 2 : 1;
	}
	return width;
}

/**
 * 同一行输出str1, str2，str1居左, str2居右
 * @param {string} str1 内容1
 * @param {string} str2 内容2
 * @param {number} fontWidth 字符宽度 1/2
 * @param {string} fillWith str1 str2之间的填充字符
 *
 */
function inline(str1, str2, fillWith = ' ', fontWidth = 1) {
	const lineWidth = MAX_CHAR_COUNT_EACH_LINE / fontWidth;
	// 需要填充的字符数量
	let fillCount = lineWidth - (getStringWidth(str1) + getStringWidth(str2)) % lineWidth;
	let fillStr = new Array(fillCount).fill(fillWith.charAt(0)).join('');
	return str1 + fillStr + str2;
}

/**
 * 同一行输出str1, str2，str1居左, str2居右
 * @param {string} str1 内容1
 * @param {string} str2 内容2
 * @param {string} str3 内容3
 * @param {number} fontWidth 字符宽度 1/2
 * @param {string} fillWith str1 str2之间的填充字符
 *
 */
function inlineThird(str1, str2,str3, fillWith = ' ', fontWidth = 1) {
	str3=parseFloat(str3).toFixed(2)
	const lineWidth = MAX_CHAR_COUNT_EACH_LINE / fontWidth;
	// 需要填充的字符数量
	let fillCount = lineWidth - (getStringWidth(str1) + 16) % lineWidth;
	let fillStr1 = new Array(fillCount).fill(fillWith.charAt(0)).join('');
	let fill2Count= 8 - (getStringWidth(str2))
	let fillStr2=new Array(fill2Count).fill(fillWith.charAt(0)).join('');
	let fill3Count= 8 - getStringWidth(str3)
	let fillStr3=new Array(fill3Count).fill(fillWith.charAt(0)).join('');
	return str1 + fillStr1 + fillStr2 +str2 + fillStr3 + str3;
}
/**
 * 用字符填充一整行
 * @param {string} fillWith 填充字符
 * @param {number} fontWidth 字符宽度 1/2
 */
function fillLine(fillWith = '-', fontWidth = 1) {
	const lineWidth = MAX_CHAR_COUNT_EACH_LINE / fontWidth;
	return new Array(lineWidth).fill(fillWith.charAt(0)).join('');
}

/**
 * 文字内容居中，左右用字符填充
 * @param {string} str 文字内容
 * @param {number} fontWidth 字符宽度 1/2
 * @param {string} fillWith str1 str2之间的填充字符
 */
function fillAround(str, fillWith = '-', fontWidth = 1) {
	const lineWidth = MAX_CHAR_COUNT_EACH_LINE / fontWidth;
	let strWidth = getStringWidth(str);
	// 内容已经超过一行了，没必要填充
	if (strWidth >= lineWidth) {
		return str;
	}
	// 需要填充的字符数量
	let fillCount = lineWidth - strWidth;
	// 左侧填充的字符数量
	let leftCount = Math.round(fillCount / 2);
	// 两侧的填充字符，需要考虑左边需要填充，右边不需要填充的情况
	let fillStr = new Array(leftCount).fill(fillWith.charAt(0)).join('');
	return fillStr + str + fillStr.substr(0, fillCount - leftCount);
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
	const hexArr = Array.prototype.map.call(
		new Uint8Array(buffer),
		function(bit) {
			return ('00' + bit.toString(16)).slice(-2)
		}
	)
	return hexArr.join(',')
}


module.exports = {
	inline: inline,
	fillLine: fillLine,
	fillAround: fillAround,
	ab2hex:ab2hex,
	inlineThird:inlineThird
};
