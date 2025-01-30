const inspect = Symbol.for('nodejs.util.inspect.custom');
const {floor} = Math;
const {combination} = require('./combination.js');

function first(itr){
	for(let val of itr){
		return val;
	}
}

function countItems(sets){
	let map = new Map();
	for(let item of sets){
		let set = item.cell || item;
		for(let value of set){
			let count = !map.has(value) ? 1 : map.get(value)+1;
			map.set(value, count);
		}
	}
	return map;
}

class Cell extends Set{
	constructor(row, col){
		super([1,2,3,4,5,6,7,8,9]);
		this.row = row;
		this.col = col;
	}

	[inspect](depth, options){
		//console.log(options);
		let {row, col} = this;
		let values = [...this].sort().map(a=>(options.stylize(a, 'number'))).join(', ');
		
		
		return `(${row}, ${col}):  {${values}}`;
		
	}
	
	toString(){
		let {row, col} = this;
		return `(${row}, ${col})`;
	}
}

const Array9 = (callback)=>(Array.from({length:9}, callback));
const Array3 = (callback)=>(Array.from({length:3}, callback));

class Sudocu{
	constructor(){
		const fullSet = ()=>(new Set([1,2,3,4,5,6,7,8,9]));
		const fullMap = ()=>(new Map([1,2,3,4,5,6,7,8,9].map(x=>([x,9]))));
		//Списки недостающих значений
		this.columns = Array9(fullMap);
		this.rows = Array9(fullMap);;
		this.squares = Array9(fullMap);;
		//Проставленные значения
		this.values = Array9(()=>(Array9(()=>(NaN))));
		//Списки разрешённых значений
		this.cells = Array9((_, row)=>(Array9((_, col)=>(new Cell(row, col)))));
		
		//Подстроки и подстолбцы - части строк и столбцов, ограниченные квадратами
		//Набор хранит значения, эксклюзивные для триплета
		this.subcolumns = Array9(()=>(Array3(()=>(new Set()))));
		this.subrows = Array9(()=>(Array3(()=>(new Set()))));
		
		this.report = [];
	}
	
	clone(){
		
	}
	
	log(str){
		this.report.push(str);
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
	
	* itrSubrowsForSquare(index){
		let hcol = index % 3;
		let hrow = floor(index/3);
		for(let i = 0; i<3; ++i){
			let row = hrow*3 + i;
			yield {row, hcol, values:this.subrows[row][hcol]};
		}
	}
	* itrSubcolumnsForSquare(index){
		let hcol = index % 3;
		let hrow = floor(index/3);
		for(let i = 0; i<3; ++i){
			let col = hcol*3 + i;
			yield {col, hrow, values:this.subcolumns[col][hrow]};
		}
	}
	
	* itrSubrowsForRow(row){
		yield* this.subrows[row].map((values, hcol)=>({row, hcol, values}));
	}

	* itrSubcolumnsForColumn(col){
		yield* this.subcolumns[col].map((values, hrow)=>({col, hrow, values}));
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
			yield {col, row, cell:this.cells[row][col]};
		}
	}
	
	*itrItrCellsForCell(row, col){
		yield this.itrRowCells(row);
		yield this.itrColumnCells(col);
		yield this.itrSquareCells(this.squareIndex(row, col));
	}
	
	*itrCellsForSubrow(row, hcol){
		for(let i = 0; i<3; ++i){
			let col = hcol*3 + i;
			yield {col, row, cell:this.cells[row][col]};
		}
	}

	*itrCellsForSubcolumn(col, hrow){
		for(let i = 0; i<3; ++i){
			let row = hrow*3 + i;
			yield {col, row, cell:this.cells[row][col]};
		}
	}
	
	itrCellsForTriplet(triplet){
		if('col' in triplet && 'hrow' in triplet){
			return this.itrCellsForSubcolumn(triplet.col, triplet.hrow);
		}
		else if('row' in triplet && 'hcol' in triplet){
			return this.itrCellsForSubrow(triplet.row, triplet.hcol);
		}
	}
	
	hasFinal(){
		return this.values.every((row)=>(row.every((x)=>(!isNaN(x)))));
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
		for(let {map} of this.itrMapsForCell(row, col)){
			map.delete(value);
		}
		
		//Удаляем из списков разрешённых
		for(let itr of this.itrItrCellsForCell(row, col)){
			for(let item of itr){
				this.deleteOf(item.row, item.col, value);
			}
		}
		
		this.log(`Ячейка (${row}, ${col}) = ${value}, следовательно, прочие ячейки строки ${row}, столбца ${col} и квадрата ${square} не могут содержать ${value}.`);
	}
	
	/**
	 * Удаляет разрешённое значений из ячейки
	 */
	deleteOf(row, col, value){
		let cell = this.cells[row][col];
		if(cell.has(value)){
			cell.delete(value);
			for(let {map} of this.itrMapsForCell(row, col)){
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
		//yield this.rows[row];
		//yield this.columns[col];
		//yield this.squares[this.squareIndex(row, col)];
	}

	*itrMapsForCell(row, col){
		yield {map:this.rows[row], entityName: `Строка ${row}`};
		yield {map:this.columns[col], entityName: `Столбец ${col}`};
		let square = this.squareIndex(row, col);
		yield {map:this.squares[square], entityName: `Квадрат ${square}`};
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
						let report = `Ячейки: ${cluster.join(', ')} - неизбежно заключают в себе значения {${[...notes].join(', ')}}.`;
						return {cells:cluster, values:notes, report};
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
			yield {itr:this.itrRowCells(i), entityName:`ячейки строки ${i}`};
		}
		for(let i = 0; i<9; ++i){
			yield {itr:this.itrColumnCells(i), entityName:`ячейки столбца ${i}`};
		}
		for(let i = 0; i<9; ++i){
			yield {itr:this.itrSquareCells(i), entityName:`ячейки квадрата ${i}`};
		}
	}
	
	noteForTriplet(triplet){
		let cells = [...this.itrCellsForTriplet(triplet)];
		let notes = cells.map((item)=>([...item.cell]));
		return new Set(notes.flat());
	}
	
	/**
	 * Анализирует три триплета на эксклюзивные значения
	 */
	analyseThreeTriplets(itr){
		let arr = [...itr];
		let notes = arr.map((triplet)=>{
			return this.noteForTriplet(triplet);
		});
		let noteCount = countItems(notes);
		
		for(let [value, count] of noteCount){
			if(count === 1){
				let index = notes.findIndex((x)=>(x.has(value)));
				let triplet = arr[index];
				triplet.values.add(value);
			}
		}
	}
	
	analyseTriplets(){
		for(let i = 0; i<9; ++i){
			this.analyseThreeTriplets(this.itrSubrowsForSquare(i));
			this.analyseThreeTriplets(this.itrSubcolumnsForSquare(i));
		}
	}
	
	findUhandledTripletOfThree(itr, entityName){
		let arr = [...itr];
		let notes = arr.map((triplet)=>{
			return this.noteForTriplet(triplet);
		});
		let noteCount = countItems(notes);
		
		for(let triplet of arr){
			for(let value of triplet.values){
				if(noteCount.get(value) > 1){
					console.log(triplet);
					let cells = [...this.itrCellsForTriplet(triplet)].map((item)=>(item.cell)).join(', ');
					let report = `Тройка ячеек: ${cells} - необходимо содержит значение ${value}. Следовательно другие ${entityName} его не содержат.`;
					return {three:arr, triplet, value, report};
				}
			}
		}
	}
	
	findUnhandledTriplet(){
		for(let i = 0; i<9; ++i){
			let result = this.findUhandledTripletOfThree(this.itrSubrowsForRow(i), `ячейки строки ${i}`)
			if(result){
				return result;
			}
		}
		for(let i = 0; i<9; ++i){
			let result = this.findUhandledTripletOfThree(this.itrSubcolumnsForColumn(i), `ячейки столбца ${i}`)
			if(result){
				return result;
			}
		}
	}
	
	handleTriplet(unhandled){
		let {three, triplet, value} = unhandled;
		
		for(let t of three){
			if(t != triplet){
				for(let item of this.itrCellsForTriplet(t)){
					this.deleteOf(item.row, item.col, value);
				}
			}
		}
		
	}
	
	handleTripletOne(){
		this.analyseTriplets();
		let res = this.findUnhandledTriplet();
		let f = !!res;
		
		if(f){
			this.log(res.report);
			this.handleTriplet(res);
		}
		return f;
	}
	
	findCluster(){
		for(let {itr, entityName} of this.itrItrAllItrCells()){
			let arr = [...itr];
			let cluster = this.findClusterIn(arr);
			if(cluster){
				//console.log(cluster);
				let report = cluster.report + ` Следовательно, прочие ${entityName} их не содержат.`
				return {source:arr, cluster, report};
			}
		}
	}
	
	handleClusterOne(){
		let res = this.findCluster();
		let f = !!res;
		
		if(f){
			let {source, cluster, report} = res;
			this.log(report);
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
			if(cell.size === 1){
				let value = first(cell);
				if(Array.isArray(value)){
					value = value[0];
				}
				return {
					row, col, value,
					report: `Ячейка (${row}, ${col}) допускает только одно значение - ${value}.`
				};
			}
			
			/*for(let set of this.itrSetsForCell(row, col)){
				if(set.size === 1){
					let value = first(set);
					if(Array.isArray(value)){
						value = value[0];
					}
					return {row, col, value};
				}
			}*/
			for(let {map, entityName} of this.itrMapsForCell(row, col)){
				for(let [value, count] of map){
					if(count === 1){
						//console.log('map');
						if(cell.has(value)){
							return {
								row, col, value,
								report: `${entityName} допускает значение ${value} только в позиции (${row}, ${col}).`
							};
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
			}
			if(!f){
				f = this.handleTripletOne();
			}
		}
	}
	
	resolveOne(){
		let res = this.findResolve();
		let f = !!res;
		//console.log(res);
		if(f){
			let {row, col, value, report} = res;
			this.log(report);
			this.setValue(row, col, value);
		}
		return f;
	}
}

module.exports = Sudocu;