'use strict';
//sudo aptitude install gnuplot

const shuffle = require('knuth-shuffle').knuthShuffle;
const plot = require('plotter').plot;  //https://github.com/richardeoin/nodejs-plotter
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

const discard = (data, func) => {
  //пока просто соритурем, потом можно будет заменить на что то поинтереснее
  data.sort(func);
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
  //  console.log(a, b);
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

const testC = (data, count) => {
  var ndata = mutation(crossover(discard(evaluate(data, test), comparator), cr), mut);
  assert(data.length == ndata.length);
  plotData[counter] = ndata.reduce((total, item) => {
    total[item] = test(item);
    return total;
  }, {});
  if (counter < count) {
    counter++;
    return testC(ndata, count);
  } else {
    return ndata;
  }
}

var result = testC(a, 10);
result.sort(comparator);
var textResult = `Result is ${result[0]}`;
console.log(textResult);
//console.log(plotData);
plot({
  data: plotData,
  title: textResult,
  style: 'points',
  nokey: true,
  filename: 'output.png',
  format: 'png'
});
