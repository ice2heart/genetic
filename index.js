'use strict';
//sudo aptitude install gnuplot

const shuffle = require('knuth-shuffle').knuthShuffle;
const plot = require('plotter').plot; //https://github.com/richardeoin/nodejs-plotter
const assert = require('assert');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const evaluate = (data, func) => {
    var result = [];
    data.forEach((item) => {
        result.push([item, func(item)]);
    });
    return result;
}

var topResult = [0,-1000];
const discard = (data, func) => {
    //пока просто соритурем, потом можно будет заменить на что то поинтереснее
    data.sort(func);
    if (func(data[0],topResult) < func(topResult, data[0])){
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

const cr = (a, b) => {
    return (a + b) / 2;
}

const mut = (item) => {
    return item + (getRandomInt(-3, 3));
}

var a = [];
for (var i = 0; i < 200; i++) {
    a.push(getRandomInt(-30, 30));
}
const test = (item) => {
    return -1 * Math.pow(item, 2) + 10 - Math.sin(Math.pow(item, 2));
}
var counter = 0;
var plotData = {};

const test2D = (data, count) => {
    var ndata = mutation(crossover(discard(evaluate(data, test), comparator), cr), mut);
    assert(data.length == ndata.length);
    plotData[counter] = ndata.reduce((total, item) => {
        total[item] = test(item);
        return total;
    }, {});
    if (counter < count) {
        counter++;
        return test2D(ndata, count);
    } else {
        return ndata;
    }
}

var result = test2D(a, 100);
result.sort(comparator);
var textResult = `Result is ${result[0]}, top result is ${topResult[0]}`;
console.log(textResult);

var isWin = /^win/.test(process.platform);
if (!isWin) {
    plot({
        data: plotData,
        title: textResult,
        style: 'points',
        nokey: true,
        filename: 'output.png',
        format: 'png'
    });
}

//3d
const cr3d = (a, b) => {
    return [(a[0] + b[0]) / 2 ,(a[1] + b[1]) / 2];
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
var counter3d = 0;
var plotData3d = {};
topResult = [[0,0],-1000];

const test3D = (data, count) => {
    var ndata = mutation(crossover(discard(evaluate(data, test3d), comparator), cr3d), mut3d);
    assert(data.length == ndata.length);
    plotData3d[counter] = ndata.reduce((total, item) => {
        total[item] = test(item);
        return total;
    }, {});
    if (counter3d < count) {
        counter3d++;
        return test3D(ndata, count);
    } else {
        return ndata;
    }
}

var result3d = test3D(data3d, 200);
result3d.sort(comparator);
var textResult3d = `Result 3d is ${result3d[0]}, top result is ${topResult[0]}`;
console.log(textResult3d);
