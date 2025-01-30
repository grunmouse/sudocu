const {
	lowerZeroCount,
	lowerFlagCount,
	flagCount,
	nextEqFlag
} = require('./int32-fun.js');


/**
 * Декодирует комбинацию из её номера
 * Возвращает массив, наполненный номерами единичных битов переданного числа
 * @param {Int32} n
 * @return {Array<number>}
 */
function decodeCombination(n){
	let r = [], k = 0;
	while(n){
		if(n&1){
			r.push(k);
		}
		++k;
		n = n >>> 1;
	}
	return r;
}

/**
 * Генерирует все комбинации ряда чисел длиной [0, N];
 */
function combinationAll(N){
	var len = 1<<(N), index=0;
	var result = [];
	while(index<len){
		result.push(decodeCombination(index));
		++index;
	}
	return result;
}

/**
 * Находит все комбинации из N длиной меньше m
 * @param {int[0..31]} N
 * @param {int[0..31]} m
 * @return {Array<int[0..31]>}
 */
function combinationCurz(N, m){
	var len = 1<<(N), index=0;
	var result = [];
	while(index<len){
		result.push(decodeCombination(index));
		if(flagCount(index)===m){
			index += 1<<lowerZeroCount(index);
		}
		else{
			++index;
		}
	}
	return result;
	
}

/**
 * Находит все комбинации из N длиной равной m
 * @param {int[0..31]} N
 * @param {int[0..31]} m
 * @return {Array<int[0..31]>}
 */
function combinationEq(N, m){
	var len = 1<<(N), index=(1<<m) - 1;
	var result = [];
	while(index<len){
		result.push(decodeCombination(index));
		index = nextEqFlag(index);
	}
	return result;
	
}

module.exports = {
	decodeCombination,
	combinationAll,
	combinationCurz,
	combinationEq
};