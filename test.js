const Sudocu = require('./sudocu.js');

//module.exports = function(){
const sudocu = new Sudocu();

const task = `*7**29*45
***158**6
2**3***9*
*****1***
9**2**6*7
4*******3
*6******8
****3****
*3*5*6*7*
`;

sudocu.parseValues(task);

sudocu.resolve();
console.log();
//console.log(sudocu.report.join("\n"));
console.log();
console.log(sudocu.printValues());

//sudocu.handleTripletOne();
//sudocu.analyseThreeTriplets(sudocu.itrSubcolumnsForSquare(0));

if(!sudocu.hasFinal()){
	console.log(sudocu.cells);
}
//}