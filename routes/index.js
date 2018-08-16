var express = require('express');
var models = require('../models');
var router = express.Router();

const Op = models.Sequelize.Op;
var paramLists = ["product", "hostip", "site", "package",
                  "updater", "derivativehash", "updatersig"];
  


var checkParams = function(body){
  for(var i=0; i<paramLists.length; i++){
    if (body[paramLists[i]] == undefined)
      return paramLists[i]+" is missing"
  }
  if (body.time == undefined)
    body.time = new Date().toLocaleString();
  else
    body.time =  new Date(Number(body.time)*1000).toLocaleString();	
  return body;
}

var sendPostResponse = function(res, result, reason){
  res.setHeader('Content-Type', 'application/json');
  if (result)
    res.send('{ "result": "succ" }');
  else
    res.send('{"result": "fail", "reason": "'+reason+'" }');
}



var makeChkSum= function(str) {
	var s= "";
	var hex,hex1,hex2,hex3;
	
	if(str && str.length>8) {
		hex1= str.charAt(0) + str.charAt(1);
		hex3= str.charAt(str.length-2) + str.charAt(str.length-1);
		hex2= str.charAt(str.length>>1) + str.charAt((str.length>>1)+1);
		try {
			hex= parseInt(hex1,16) + parseInt(hex2,16) + parseInt(hex3,16);
			s= hex.toString(16);
			if(s.length<4) {
				while(s.length<4) {
					s= '0' + s;
				}						
			}
			else {
				s= s.substring(0, 4);
			}			
		}
		catch(e) {
			console.log(e);
		}
		console.log("s=" + s);
	}
	
	return s;
}

// home page
router.get('/', function(req, res, next) {
  // select * from install  
  res.render('index');
})

// log page
router.get('/log', function(req, res, next) {
  models.log.findAll({
    attribute: {exclude:['install_id', 'deleted']},
    include:[{model: models.install, required: true}],
    order: [['id', 'DESC']],
    limit: 2000})
  .then( data => {
    res.render('log', { title: 'Installation Logs', data: data, user: req.query.user});
    res.status(200);
  })
  .catch(err => {
    console.log(err);
    res.render('log', { title: 'Installation Logs', data: [], user: req.query.user});
    res.status(200);
  });
});

//to modeify: /add_install
router.post('/install', function(req, res, next) {


	console.log("===========");

	if( models.install==null || models.log == null) {
        res.setHeader('Content-Type', 'application/json');
        res.send('{ "result": "fail", "reason":"db error" }');
		return;
	}
    console.log(req.body); 
  var body = checkParams(req.body);
  if (typeof body == "string"){
    res.setHeader('Content-Type', 'application/json');
    res.send('{"result": "fail", "reason": "'+body+'" }')
    return; 
  } else {	

    models.install.findOrCreate({
      where:{
        product: body.product, 
        site: body.site, 
        package: body.package,
        updater: body.updater, 
        derivativehash: body.derivativehash, 
        updatersig: body.updatersig
      }
    }).spread( (installData,isNewInstall) => {
      console.log(isNewInstall);
      if (isNewInstall) {
        // Complete the last_modify for new install data
        installData.last_modify = body.time; 
        if (body.updaterhash == undefined)
          installData.updaterhash = body.derivativehash;
        else
          installData.updaterhash = body.updaterhash;
        installData.save().then(()=>{});
      
        // Add log for new install data
        models.log.create({
          time: installData.last_modify,
          hostip: body.hostip,
          install_id: installData.id
        }).then( ()=>{ 
          res.setHeader('Content-Type', 'application/json');
          res.send('{ "result": "succ"}');

          console.log("Success: add new data into log, install"); });
      }
      else { // This install data is existed in database
        
        // Verify the last_modify of existed install data
        console.log("check time " + installData.last_modify);
        var oldTime = new Date(installData.last_modify).getTime();
        var newTime = new Date(body.time).getTime();

        if (newTime>oldTime && ((newTime-oldTime)<2592000)){
          console.log("check log existence");
          models.log.findOrCreate({
            where:{
              hostip: body.hostip,
              install_id: installData.id
            }
          }).spread( (logData, isNewLog) => {
            if (isNewLog){ 
              logData.time = body.time;
              logData.save().then(()=>{});
              // Update the correspond install data
              installData.counter = installData.counter + 1;
              installData.last_modify = body.time;
              installData.save().then(()=>{
                res.setHeader('Content-Type', 'application/json');
                res.send('{ "result": "succ"}');
                console.log("Success: add new log and update install");
                return;
              });
            } else {
              // else -> this log is existed in log table
                res.setHeader('Content-Type', 'application/json');
                res.send('{ "result": "fail", "reason": "log is existed"}');

            }
          });
        }else{ // Install log is over 30 day
            res.setHeader('Content-Type', 'application/json');
            res.send('{ "result": "fail", "reason":"install is Expired"}');

        }
      }
    });
  }
});

// /installs for home page
router.get('/installs', function(req, res, next) {


	console.log("======");
  
	if( models.install==undefined ) {
    
		res.setHeader('Content-Type', 'application/json');
		res.send('{"result": "fail", "reason": "db disconnection"}');
		return;
	}

	//if(req.query.last!=undefined )
  console.log("get installation list:");
  models.install.findAll().then( rows => {
    if ( rows.length > 0) {
      var i,s,sig;
      s = '{"result": "succ", "list": [';
      for(let i=0; i<rows.length; i++) {
        sig= rows[i].updatersig!=undefined? rows[i].updatersig : "";
        s+= '{"id": ' + rows[i].id + ', "counter": ' + rows[i].counter + ', "last_modify": "' + rows[i].last_modify.toLocaleString() + '" , "product": "' + rows[i].product + '"';
          s+= ', "site": "' + rows[i].site + '", "package": "' + rows[i].package + '"';
          s+= ', "updater": "' + rows[i].updater + '", "updatersig": "' + sig + '"';
          s+= '}';
				if(i<(rows.length-1))
          s+= ', ';
      }
      s+= ']}';
			res.status(200);
			res.setHeader('Content-Type', 'application/json');
			res.send(s);
			return;
    } else { //rows.length <=0
      console.log("not found");
      res.status(200);
      res.setHeader('Content-Type', 'application/json');
      res.send('{"result": "succ", "list": []}');
      return;
    }
  }).catch( err =>{
      console.log("db err: " + err);
      res.setHeader('Content-Type', 'application/json');
      res.send('{"result": "fail"}');
      return;
  });
});


//to modeify: /list_updater
router.get('/updaters', function(req, res, next) {

	console.log("======");	
  console.log(req.query);
	
	if(req.query.seq!=undefined && req.query.limit!=undefined) {
		console.log("get updater list:");
  
    var list;
    
    models.install.findAll({
      where: {
        counter: {[Op.gte]: 1 },        // counter >= 1
        id: {[Op.gte]: Number(req.query.seq) }  // id >= seq
      },
      order: [['id','ASC']],            // order by id ASC
      limit: Number(req.query.limit)
    }).then( rows => {
      if (rows.length<=0){ 
					list= '{"total": "0"}';
      } 
      else {
        list= '{"total": "' + rows.length + '", "end": "'+rows[rows.length-1].id+ '", "list": [';
        for (let row of rows)
          list+= '{"seq": "' + row.id + '", "updater": "' + row.updater + '", "derivativehash": "' + row.derivativehash + '"},';
        list = list.slice(0,-1) + ']}';
      }
        console.log("list=" + list);
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
		    res.send(list);
		    return;
    }).catch(err => {
      console.log("db err: " + err);
      res.setHeader('Content-Type', 'application/json');
      res.send('{"result": "fail"}');
    });
  } else {    //  req.query.seq==undefined || req.query.limit==undefined
		res.setHeader('Content-Type', 'application/json');
		res.send('{"result": "unknown"}');
	}
});

router.post('/query_updater', function(req, res, next) {
	
	console.log("======");
	
	if(req.body.package!=undefined && req.body.derivativehash!=undefined) {

		console.log("query updater:");
    
    models.install.findAll({
      where: {
        derivativehash: req.body.derivativehash,  
        counter: {[Op.gte]: 1}  //counter >= 1
      }
    }).then(rows => {
      console.log(rows)
      if (rows.length == 0){
        console.log("not found");
        res.setHeader('Content-Type', 'application/json');
        res.send('{"trust": "false"}');
      } else {
        var s= 'counter=' + (rows[0].counter);
        var chk= makeChkSum(rows[0].derivativehash);
        console.log(s);
        res.setHeader('Content-Type', 'application/json');
        res.send('{"trust": "true", "check":"' + chk+ '"}');
      }
    }).catch(err => {
      console.log("db err: " + err);
			res.setHeader('Content-Type', 'application/json');
			res.send('{"trust": "unknown"}');
    });
  }else{
    res.setHeader('Content-Type', 'application/json');
		res.send('{"trust": "false"}');
  }
});

module.exports = router;
