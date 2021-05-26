const fs = require('fs');

function pushFloppa(obj) {
    if (!fs.existsSync('flop.json')) {
        fs.writeFileSync('flop.json', JSON.stringify({ entries: [obj] }));
    } else {
        let data = JSON.parse(fs.readFileSync('flop.json'));
        data.entries.push(obj);
        fs.writeFileSync('flop.json', JSON.stringify(data));
        console.info(`Pushing object to floppabase {\n\timage: ${obj.image},\n\tdesc: ${obj.desc},\n\tdate: ${obj.date}\n}`);
    }
}

function pullFloppa() {
    if (!fs.existsSync('flop.json')) {
        return null;
    }
    let data = JSON.parse(fs.readFileSync('flop.json'));
    console.info('Pulling from floppabase');
    return data;
}

module.exports.pushFloppa = pushFloppa;
module.exports.pullFloppa = pullFloppa;