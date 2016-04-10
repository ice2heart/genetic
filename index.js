'use strict';
//sudo aptitude install gnuplot

const shuffle = require('knuth-shuffle').knuthShuffle;
const plot = require('plotter').plot; //https://github.com/richardeoin/nodejs-plotter
const assert = require('assert');
const Promise = require('bluebird');
Promise.longStackTraces(); //debug

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const evaluate = (data, func) => {
    return Promise.all(data.map((i) => {
        return [i, func(i)];
    }));
}

var topResult = [0, -1000];
const discard = (data, func) => {
    //пока просто соритурем, потом можно будет заменить на что то поинтереснее
    data.sort(func);
    if (func(data[0], topResult) < func(topResult, data[0])) {
        topResult = data[0];
    }
    data.splice(-1 * data.length / 2, data.length / 2);
    data = data.map((item) => {
        return item[0];
    })
    return data;
}

const crossover = (data, func) => {
    var child = [];
    data.forEach((item) => {
        child.push(func(item, data[getRandomInt(0, data.length - 1)]));
    });
    return data.concat(child);
}

const mutation = (data, func) => {
    shuffle(data);
    var mdata = data.splice(-1 * data.length / 2, data.length / 2);
    mdata = mdata.map(func);
    return data.concat(mdata);
}

const comparator = (a, b) => {
    return b[1] - a[1]; //сортируем по убыванию
}

const cr3d = (a, b) => {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

const mut3d = (item) => {
    return [item[0] + (getRandomInt(-3, 3)), item[1] + (getRandomInt(-3, 3))];
}

var data3d = [];
for (var i = 0; i < 200; i++) {
    data3d.push([getRandomInt(-30, 30), getRandomInt(-30, 30)]);
}
const test3d = (item) => {
    return -1 * (3 * Math.pow(item[0], 2) + item[0] * item[1] + 2 * Math.pow(item[1], 2) - item[0] - 4 * item[1]);
}
topResult = [
    [0, 0], -1000
];

const func3D = (data, count, plotData) => {
    return new Promise((resolve) => {
        if (typeof(plotData) == 'undefined') {
            plotData = {};
        }
        evaluate(data, test3d).then((edata) => {
            var ndata = mutation(crossover(discard(edata, comparator), cr3d), mut3d);
            assert(data.length == ndata.length);
            plotData[count] = ndata.reduce((total, item) => {
                total[item] = test3d(item);
                return total;
            }, {});
            if (count > 0) {
                count--;
                func3D(ndata, count, plotData).then(resolve);
            } else {
                resolve({data:ndata, polt:plotData});
            }
        });
    });
}

func3D(data3d, 20).then((res) => {
    var result = res['data'];
    var plotData = res['polt'];
    result.sort(comparator);
    var textResult3d = `Result 3d is ${result[0]}, top result is ${topResult[0]}, ${plotData}`;
    console.log(textResult3d);
    var isWin = /^win/.test(process.platform);
    if (!isWin) {
        plot({
            data: plotData3d,
            title: textResult,
            style: 'points',
            nokey: true,
            filename: 'output.png',
            format: 'png'
        });
    }
});
//var result3d = func3D(data3d, 200);
//result3d.sort(comparator);
//var textResult3d = `Result 3d is ${result3d[0]}, top result is ${topResult[0]}`;
//console.log(textResult3d);
