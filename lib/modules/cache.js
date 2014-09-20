var async = require('async');
var _ = require('underscore');
module.exports = function(app){
    var refresh_calls = [];
    app.cache = function(namespace, data, refresh_events, callback){
        if(!_.isFunction(data)){
            app.cache[namespace] = data;
        }else{
            refresh_calls.push({
                namespace:namespace,
                call:data,
                refresh_events:refresh_events
            });
            data(null, function(err, _data){
                if(err){
                    if(callback){
                        return callback(err);
                    }else{
                        throw err;
                    }
                }
                _data.refresh = data;
                app.cache[namespace] = _data;
            });
        }
    }
    app.cache.refresh = function(event, data, callback){
        if(_.isFunction(event)){
            callback = event;
            event = null;
        }else if(_.isFunction(data)){
            callback = data;
            data = null;
        }
        async.eachSeries(
            refresh_calls,
            function(refresh_call, cb){
                if(!event || _.contains(refresh_call.events, event)){
                    return cb();
                }
                return refresh_call.call(function(err, data){
                    if(err) return callback(err);
                    data.refresh = refresh_call.call;
                    app.cache[refresh_call.namespace] = data;
                    return cb();
                });
            },
            function(errs){
                if(callback){
                    return callback(null, app.cache);
                }
                console.log("Finished Refreshing");
            }
        )
    }



}