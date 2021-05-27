const fs = require('fs');

function pushElement(FILENAME, obj) {
    if (!fs.existsSync(FILENAME)) {
        fs.writeFileSync(FILENAME, JSON.stringify({ entries: [obj] }));
    } else {
        let data = JSON.parse(fs.readFileSync(FILENAME));
        data.entries.push(obj);
        fs.writeFileSync(FILENAME, JSON.stringify(data));
        //console.info(`Pushing object to ${FILENAME}\n${JSON.stringify(data)}`);
    }
}

function elementExists(FILENAME, obj) {
    const data = pullArray(FILENAME);
    if(data == null || data == undefined) {
        return false;
    }
    return (data.entries.findIndex((element) => {
        if(element.id != null) {
            return element.id == obj.id;
        } else {
            return element.image == obj.image;
        }
    }) > -1) ? true : false;
};

function pushArray(FILENAME, data) {
    if(fs.existsSync(FILENAME)) {
        fs.unlinkSync(FILENAME);
    }
    fs.writeFileSync(FILENAME, JSON.stringify(data));
    console.info(`Pushing new array to ${FILENAME}`);
}

function pullArray(FILENAME) {
    if (!fs.existsSync(FILENAME)) {
        return null;
    }
    let data = JSON.parse(fs.readFileSync(FILENAME));
    console.info(`Pulling from ${FILENAME}`);
    return data;
}

module.exports.elementExists = elementExists;
module.exports.pushArray = pushArray;
module.exports.pushElement = pushElement;
module.exports.pullArray = pullArray;