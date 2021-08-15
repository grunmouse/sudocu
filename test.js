const Sudocu = require('./sudocu.js');

const sudocu = new Sudocu();

const task = `8**2*6*73
**6*4****
**5***9**
*1*4***6*
**7******
****8*1*7
479*3***5
*********
**87**21*
`;


sudocu.parseValues(task);

sudocu.resolve();
console.log();
console.log(sudocu.printValues());
console.log(sudocu.cells);
