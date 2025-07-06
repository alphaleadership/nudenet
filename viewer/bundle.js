const nodemon=require('nodemon');
console.log("nodemon");
console.log(nodemon)
let t=0;
const handler=nodemon({
    script: 'bin/www',
    ext: 'js',
    ignore: ['node_modules/**/*', 'categories.json', 'good/**/*', 'media/**/*', 'downnloads.json'],
    delay: 1000
})

handler.on('restart', () => {
    console.log('Server restarted!');
});
handler.on('quit', () => {
    console.log('Server quit!');
    process.exit(0);
});
handler.on('crash', () => {
    console.log('Server crashed!');
    process.exit(1);
});
handler.on('error', (error) => {
    console.log('Server error!');
    console.log(error);
    process.exit(1);
});
handler.on('exit', () => {
    console.log('Server exit!');
    handler.restart()
});
handler.on("log", (log) => {
    console.log('Server log!');
    t++;
    //console.log(log);
    if(t==5){
        handler.restart()
        t=0;
    }
});
process.stdin.on('data', (data) => {
    console.log('Server data!');
    console.log(data);
    handler.restart()
});
process.on('SIGINT', () => {
    handler.emit('quit');
});

