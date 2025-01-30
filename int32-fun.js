/**
 * Подсчитывает нулевые биты в младших разрядах до первой единицы, возвращает их количество
 * @param {Int32} value
 * @return {number[0..32]}
 */
function lowerZeroCount(value){
	let r = 0;
	while(value){
		if(value&1){
			return r;
		}
		else{
			++r;
			value = value>>>1;
		}
	}
	
}
/**
 * Подсчитывает единичные биты в младших разрядах до первого нуля, возвращает их количество
 * @param {Int32} value
 * @return {number[0..32]}
 */
function lowerFlagCount(value){
	let r = 0;
	while(value){
		if(value&1){
			++r;
			value = value>>>1;
		}
		else{
			return r;
		}
	}
	return r;
}

/**
 * Все единичные биты в числе, возвращает их количество
 * @param {Int32} value 
 * @return {number[0..32]}
 */
function flagCount(value){
	let r =0;
	while(value){
		if(value & 1){
			++r;
		}
		value = value>>>1;
	}
	return r;
}

/**
 * Для числа value возвращает ближайшее большее число с тем же количеством единичных битов
 * @param {Int32} value
 * @return {Int32}
 */
function nextEqFlag(value){
	let lz = lowerZeroCount(value);
	let f = lowerFlagCount(value>>>lz)-1;
	return value + (1<<lz) + ((1<<f)-1);
}


module.exports = {
	lowerZeroCount,
	lowerFlagCount,
	flagCount,
	nextEqFlag
	
};
