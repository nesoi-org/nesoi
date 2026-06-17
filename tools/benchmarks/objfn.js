const N = 1000;

function make(i) {
    return Function(' return {'
        +`a: ${i},\n`
        +`b: '2'+${i},\n`
        +`c: ${i}>10\n`
    +'}')
}

console.log('hi');

setInterval(() => {
    const banana = [...Array.from({ length: N }).map((_, i) => make(i))]
    console.log('allocated ', banana.length);
}, 10000);

// setInterval(() => {
//     console.log('ping');
// }, 1000);