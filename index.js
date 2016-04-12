'use strict';
//sudo aptitude install gnuplot

const shuffle = require('knuth-shuffle').knuthShuffle;
const plot = require('plotter').plot; //https://github.com/richardeoin/nodejs-plotter
const assert = require('assert');
const Promise = require('bluebird');
Promise.longStackTraces(); //debug
const rpc = require('amqp-rpc').factory({
  url: "amqp://guest:guest@localhost:5672"
});


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const evaluate = (data, func) => {
  //более красивое апи,
  return Promise.all(data.map((i) => {
    return func(i);
  }));
}

const discard = (data, func, top) => {
  //пока просто соритурем, потом можно будет заменить на что то поинтереснее
  data.sort(func);
  //console.log(func(data[0], top) < func(top, data[0]), func(data[0], top), func(top, data[0]), top, data[0]);
  if (func(data[0], top['data']) < func(top['data'], data[0])) {
    top['data'] = data[0];
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
  return [data, child];
}

const mutation = (data, func) => {
  var par = data[0];
  var child = data[1];
  shuffle(child);
  var mdata = child.map(func);
  return par.concat(mdata);
}

const comparator = (a, b) => {
  return b[1] - a[1]; //сортируем по убыванию
}

const cr3d = (a, b) => {
  if (getRandomInt(0, 1)) {
    if (getRandomInt(0, 1)) {
      return [a[1], b[0]];
    } else {
      return [a[0], b[1]];
    }
  } else {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }
}

const mut3d = (item) => {
  if (getRandomInt(0, 1)) {
    return item;
  } else {
    return [item[0] + (getRandomInt(-3, 3)), item[1] + (getRandomInt(-3, 3))];
  }

}

var data3d = [];
for (var i = 0; i < 200; i++) {
  data3d.push([getRandomInt(-30, 30), getRandomInt(-30, 30)]);
}
const test3d = (item) => {
  return new Promise((resolve) => {
    rpc.call('func3d', item, function(msg) {
      resolve([item, msg]);
    });
  });
}

const func3D = (data, count, plotData, top) => {
  return new Promise((resolve) => {
    if (typeof(plotData) == 'undefined') {
      plotData = {};
    }
    if (typeof(top) == 'undefined') {
      top = {
        data: [
          [0, 0], -1000
        ]
      };
    }
    evaluate(data, test3d).then((edata) => {
      //Меняем алгоритм. Добавляем 2 шага. Мутация происходит только для детей, и доп шаг с отсеиванием
      var ndata = mutation(crossover(discard(edata, comparator, top), cr3d), mut3d);
      //console.log(top.data);
      assert(data.length == ndata.length);
      plotData[count] = ndata.reduce((total, item) => {
        total[item] = test3d(item);
        return total;
      }, {});
      if (count > 0) {
        count--;
        func3D(ndata, count, plotData, top).then(resolve);
      } else {
        resolve({
          data: ndata,
          polt: plotData,
          top: top
        });
      }
    });
  });
}

func3D(data3d, 20).then((res) => {
  var result = res['data'];
  var plotData = res['polt'];
  result.sort(comparator);
  var textResult = `Result 3d is ${result[0]}, top result is ${res.top.data[0]}, ${plotData}`;
  console.log(textResult);
  process.exit();
  /*if (!/^win/.test(process.platform)) {
    plot({
      data: plotData,
      title: textResult,
      style: 'points',
      nokey: true,
      filename: 'output.png',
      format: 'png'
    });
  }*/
});
