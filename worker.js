const rpc = require('amqp-rpc').factory({
    url: "amqp://guest:guest@localhost:5672"
});

rpc.on('func3d', function(param, cb){
    var result = -1 * (3 * Math.pow(param[0], 2) + param[0] * param[1] + 2 * Math.pow(param[1], 2) - param[0] - 4 * param[1]);
    cb(result);
});
