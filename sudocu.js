const {floor} = Math;
const {combination} = require('@grunmouse/combinatorics');

function first(itr){
	for(let val of itr){
		return val;
	}
}

function countItems(sets){
	let map = new Map();
	for(let set of sets){
		//console.log(set);
		for(let value of set.cell){
			let count = !map.has(value) ? 1 : map.get(value)+1;
			map.set(value, count);
		}
	}
	return map;
}



class Sudocu{
	constructor(){
		const fullSet = ()=>(new Set([1,2,3,4,5,6,7,8,9]));
		const fullMap = ()=>(new Map([1,2,3,4,5,6,7,8,9].map(x=>([x,9]))));
		const Array9 = (callback)=>(Array.from({length:9}, callback));
		//Списки недостающих значений
		this.columns = Array9(fullMap);
		this.rows = Array9(fullMap);;
		this.squares = Array9(fullMap);;
		//Проставленные значения
		this.values = Array9(()=>(Array9(()=>(NaN))));
		//Списки разрешённых значений
		this.cells = Array9(()=>(Array9(fullSet)));
	}
	
	/*
		5*6**3*8*
		4***8**7*
		***2***35
		2**6*****
		*95***86*
		8**9****4
		**4**93*8
		********2
		*1******9
	*/
	parseValues(code){
		code.split(/[\r\n]+/g).forEach((rowcode, row)=>{
			rowcode.split('').forEach((x, col)=>{
				x = Number(x);
				if(!isNaN(x)){
					this.setValue(row, col, x);
				}
			});
		});
		console.log('parse ok');
	}
	
	*itrPosition(){
		for(let index = 0; index<3**4; ++index){
			let p = index, parts = [];
			for(let i=0; i<4; ++i){
				parts[i] = p % 3;
				p -= parts[i];
				p /= 3;
			}
			let [lcol, hcol, lrow, hrow] = parts;
			yield {lcol, hcol, lrow, hrow}
		}
	}
	
	printValues(){
		let p = [];
		for(let {lcol, hcol, lrow, hrow} of this.itrPosition()){
			let row = hrow*3 + lrow;
			let col = hcol*3 + lcol;
			let r = hrow*4 + lrow;
			let c = (hcol*4 + lcol)*2;
			if(!p[r]){
				p[r] = [];
			}
			p[r][c] = this.values[row][col] || '*';
		}
		for(let r = 0; r<p.length; ++r){
			if(!p[r]){
				p[r] = [];
			}
			else{
				let row = p[r];
				for(let c = 0; c<row.length; ++c){
					if(!row[c]){
						row[c] = ' ';
					}
				}
			}
		}
		//console.log(p);
		return p.map((row)=>(row.join(''))).join('\n');
	}
	
	squareIndex(row, col){
		row = floor(row/3);
		col = floor(col/3);
		return row * 3 + col;
	}
	
	*itrSquareCells(index){
		let hcol = index % 3;
		let hrow = floor(index/3);
		for(let y=0; y<3; ++y) for(let x=0; x<3; ++x){
			let col = hcol*3 + x;
			let row = hrow*3 + y;
			yield {col, row, cell:this.cells[row][col]};
		}
	}
	
	*itrColumnCells(col){
		for(let row = 0; row<9; ++row){
			yield {col, row, cell:this.cells[row][col]};
		}
	}

	*itrRowCells(row){
		for(let col = 0; col<9; ++col){
			yield {col, row, cell:this.cells[row][col]}
		}
	}
	
	*itrItrCellsForCell(row, col){
		yield this.itrRowCells(row);
		yield this.itrColumnCells(col);
		yield this.itrSquareCells(this.squareIndex(row, col));
	}
	
	hasFinal(){
		return this.values.every((row)=>(row.values.every((x)=>(!isNaN(x)))));
	}
	
	setValue(row, col, value){

		let square = this.squareIndex(row, col);

		//Устанавливаем значение
		this.values[row][col] = value;
		//this.cells[row][col] = new Set();
		for(let i=1; i<10; ++i){
			this.deleteOf(row, col, i);
		}
		
		//Удаляем из списков недостающих
		for(let map of this.itrMapsForCell(row, col)){
			map.delete(value);
		}
		
		//Удаляем из списков разрешённых
		for(let itr of this.itrItrCellsForCell(row, col)){
			for(let item of itr){
				this.deleteOf(item.row, item.col, value);
			}
		}
	}
	
	/**
	 * Удаляет разрешённое значений из ячейки
	 */
	deleteOf(row, col, value){
		let cell = this.cells[row][col];
		if(cell.has(value)){
			cell.delete(value);
			for(let map of this.itrMapsForCell(row, col)){
				if(map.has(value)){
					let count = map.get(value);
					--count;
					if(count > 0 ){
						if(typeof value !== 'number'){
							throw new Error('NaN');
						}
						map.set(value, count);
					}
					else{
						map.delete(value);
					}
				}
			}
		}
	}
	
	*itrSetsForCell(row, col){
		yield this.cells[row][col];
		yield this.rows[row];
		yield this.columns[col];
		yield this.squares[this.squareIndex(row, col)];
	}

	*itrMapsForCell(row, col){
		yield this.rows[row];
		yield this.columns[col];
		yield this.squares[this.squareIndex(row, col)];
	}
	
	/**
	 * Ищет группу клеток, число допустимых значений в которых, равно числу клеток
	 */
	findClusterIn(itr){
		let arr = [...itr].filter(({col, row})=>(isNaN(this.values[row][col])));
		let allNotes = new Set(arr.map((x)=>([...x.cell])).flat());
		let len = arr.length;
		for(let count = 2; count<len; ++count){
			let combs = combination.combinationEq(len, count);
			for(let comb of combs){
				let cluster = comb.map((i)=>(arr[i].cell));
				let notes = new Set(cluster.map((cell)=>([...cell])).flat());
				if(notes.size === cluster.length){
					let ctrl = arr.filter(({cell})=>(!cluster.includes(cell)));
					let other = new Set(ctrl.map((x)=>([...x.cell])).flat());
					if(notes.size + other.size > allNotes.size){
						return {cells:cluster, values:notes};
					}
				}
			}
		}
	}
	
	handleClusterIn(itr, cluster){
		for(let item of itr){
			if(!cluster.cells.includes(item.cell)){
				for(let value of cluster.values){
					this.deleteOf(item.row, item.col, value);
				}
			}
		}
	}
	
	*itrItrAllItrCells(){
		for(let i = 0; i<9; ++i){
			yield this.itrRowCells(i);
		}
		for(let i = 0; i<9; ++i){
			yield this.itrColumnCells(i);
		}
		for(let i = 0; i<9; ++i){
			yield this.itrSquareCells(i);
		}
	}
	
	findCluster(){
		for(let itr of this.itrItrAllItrCells()){
			let arr = [...itr];
			let cluster = this.findClusterIn(arr);
			if(cluster){
				return {source:arr, cluster};
			}
		}
	}
	
	handleClusterOne(){
		let res = this.findCluster();
		let f = !!res;
		
		if(f){
			let {source, cluster} = res;
			this.handleClusterIn(source, cluster);
		}
		return f;		
	}
	
	/**
	 * Ищет ячейки, которые можно легко разрешить.
	 */
	findResolve(){
		for(let row = 0; row<9; ++row) for(let col = 0; col<9; ++col) if(isNaN(this.values[row][col])){
			let cell = this.cells[row][col];
			for(let set of this.itrSetsForCell(row, col)){
				if(set.size === 1){
					let value = first(set);
					if(Array.isArray(value)){
						value = value[0];
					}
					return {row, col, value};
				}
			}
			for(let map of this.itrMapsForCell(row, col)){
				for(let [value, count] of map){
					if(count === 1){
						//console.log('map');
						if(cell.has(value)){
							return {row, col, value};
						}
					}
				}
			}
		}
	}
	
	resolve(){
		let f = true;
		while(f){
			f = this.resolveOne();
			if(!f){
				f = this.handleClusterOne();
				if(f){console.log('cluster')};
			}
		}
	}
	
	resolveOne(){
		let res = this.findResolve();
		let f = !!res;
		//console.log(res);
		if(f){
			let {row, col, value} = res;
			this.setValue(row, col, value);
		}
		return f;
	}
}

module.exports = Sudocu;