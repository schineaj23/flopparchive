const db = require('./jsondb');

function pushFloppa(obj) {
    db.pushElement("flop.json", obj);
}

function pullFloppa() {
    return db.pullArray("flop.json");
}

module.exports.pushFloppa = pushFloppa;
module.exports.pullFloppa = pullFloppa;