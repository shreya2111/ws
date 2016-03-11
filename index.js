//Author: Anurag Kr. Mishra
//Dos: 10/12/2015
//Doe:  /12/2015

var express = require('express');
var ws = express();
var bodyParser = require('body-parser');
var port = process.env.PORT || 5000;
var pg =require('pg');
var conString = "postgres://postgres:anurag@localhost/Water24X7"
var client = new pg.Client(conString);
var spawn = require('child_process').spawn;
var geocoderProvider = 'google';
var httpAdapter = 'https';
var pdfgen = require('./pdf.js');
var fileget = require('./file.js');
var nodemailer = require('nodemailer');
//--------------------------------------SMS sending--------------------------------------------------------
/*
var twilio = require('twilio');
 
// Create a new REST API client to make authenticated requests against the
// twilio back end
var client = new twilio.RestClient('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');
 
// Pass in parameters to the REST API using an object literal notation. The
// REST client will handle authentication and response serialzation for you.
client.sms.messages.create({
    to:'NUMBER_TO_SEND_SMS',
    from:'TWILIO_NUMBER_AS_PROVIDED_IN_YOUR_ACCOUNT',
    body:'MESSAGE-BODY_GOES_HERE...!!'
}, function(error, message) {
    // The HTTP request to Twilio will run asynchronously. This callback
    // function will be called when a response is received from Twilio
    // The "error" variable will contain error information, if any.
    // If the request was successful, this value will be "falsy"
    if (!error) {
        // The second argument to the callback will contain the information
        // sent back by Twilio for the request. In this case, it is the
        // information about the text messsage you just sent:
        console.log('Success! The SID for this SMS message is:');
        console.log(message.sid);
 
        console.log('Message sent on:');
        console.log(message.dateCreated);
    } else {
        console.log('Oops! There was an error.');
    }
});
*/
//------------------------------------------------------------------------------
var extra = {
  apiKey: "AIzaSyDZ8Ho-bV4FdQA_nlZSvsr8t_1Lw-PhaEM",
  formatter:null
};

var geocoder = require('node-geocoder')(geocoderProvider,httpAdapter,extra);



//------------------------------------------------------------------------------------
ws.get('/download',function(req,res){
  res.download('./tmp/basics.pdf', 'file:///tmp/basics.pdf')

})

ws.set('view engine','ejs');
ws.use(express.static(__dirname + '/public'));
ws.use(bodyParser.json());//bodyparser is a middleware used for using post variables
ws.use(bodyParser.urlencoded({extended : true}));

//.get provides the access of the webpage via browser i.e whenever user asks for get('/page')-->render this...res.render('page') 
ws.get('/',function(req,res){
	res.render('test')
});
ws.get('/test',function(req,res){
  res.render('test')
});
ws.get('/new',function(req,res){
  res.render('new')
});
ws.get('/ret',function(req,res){
  res.render('ret')
});
ws.get('/nextq',function(req,res){
  res.render('nextq')
});
ws.get('/abs',function(req,res){
  res.render('abs');
});
ws.get('/chck',function(req,res){
  res.render('chck')
});
ws.get('/admin',function(req,res){
  res.render('admin', {msg :""})
});
ws.get('/contact',function(req,res){
  res.render('contact')
});

ws.get('/about',function(req,res){
  res.render('about')
});
ws.get('/noquery',function(req,res){
  res.render('noquery')
});
//----------------------------------------------------ROUTES------------------------------------------------------------------------
//------------------------------------------FIRST QUERY GENERATE NEW REPORT COMES HERE---------------------------------------------------------------
ws.post('/nextq',function(req,res){
  var user_name=req.body.InputName;//accessing post var using body middleware
  var user_add=req.body.InputAddress;
  var user_mno=req.body.InputMno;
  var user_age=req.body.InputAge;
  var user_email=req.body.InputEmail;
  var user_job=req.body.InputJob;
  
  if(!(user_name = null) || !(user_add = null) || !(user_mno = null)|| !(user_age = null)|| !(user_email = null)|| !(user_job = null))
  {
	pg.connect(conString,function(err,client,done){
	if(err){
		return console.error('Could not connect to postgres' , err);
	}
	  client.query("INSERT INTO \"Users\" (name, address, mno, email, age, job) VALUES ($1, $2, $3, $4, $5, $6)", [user_name, user_add, user_mno, user_email, user_age, user_job], function(err,result){
    done();
    if(err) {
      return console.error('error running query', err);
    }
    else{
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
              user: 'your email id',
              pass: 'password'
          }
        }, {
          // default values for sendMail method
        from: 'your email id',
        headers: {
              'header': '123'
        }
      });
      transporter.sendMail({
          to: 'user_email',
          subject: 'your subject',
          text: 'your content'
      });
      res.render('nextq');
    }
  })
    
  }) 
	//res.redirect('nextq');
  //res.end('yes');

}
});
//------------------------------------------ASKING VILLAGE QUERY---------------------------------------------------------------
ws.post('/select',function(req,res){
  var vill = req.body.Inputvillage;
  pg.connect(conString,function(err,client,done){
  if(err){
    return console.error('Could not connect to postgres' , err);
  }
    var results = [];
    var query = client.query("SELECT * FROM  \"Area_info\" WHERE \"Folder_Name\" = $1",[vill]);
    query.on('row', function(row) {
            results.push(row);
        });
    query.on('end', function() {
            done();//query ends
            var view_data = JSON.parse(JSON.stringify(results));//conversion of array into json to send to another page       
          if(view_data.length == 0)
      {  
      function geocode(address, api_key){
      // url encode the address
      var address = encodeURIComponent(address);
      
      // google map geocode api url
      var url = "https://maps.google.com/maps/api/geocode/json?sensor=false&address={address}";
      
      // get the json response
      var resp_json = fileget.file(url);

      // decode the json
      var resp = JSON.parse(resp_json);
      
      // response status will be 'OK', if able to geocode given address 
      if(resp['status']='OK'){
        // get the important data
        var ne_lati = resp['results'][0]['geometry']['bounds']['northeast']['lat'];
        var ne_longi = resp['results'][0]['geometry']['bounds']['northeast']['lng'];
        var sw_lati = resp['results'][0]['geometry']['bounds']['southwest']['lat'];
        var sw_longi = resp['results'][0]['geometry']['bounds']['southwest']['lng'];
        var cn_lati = resp['results'][0]['geometry']['location']['lat'];
        var cn_longi = resp['results'][0]['geometry']['location']['lng'];
        
        var formatted_address = resp['results'][0]['formatted_address'];
        
        // verify if data is complete
        if(ne_lati && ne_longi && sw_lati && sw_longi && formatted_address && cn_lati && cn_longi){
          // put the data in the array
          var data_arr =[];

          
          data_arr.push(ne_lati);
          data_arr.push(ne_longi);
          data_arr.push(sw_lati);
          data_arr.push(sw_longi);
          data_arr.push(formatted_address);
          data_arr.push(cn_lati);
          data_arr.push(cn_longi);
         
          return data_arr;
          
        }
        else{
          return false;
        }         
      }
      
    }
 var API_console_key = "AIzaSyDZ8Ho-bV4FdQA_nlZSvsr8t_1Lw-PhaEM";
 var data_arr = geocode(vill,API_console_key);
      
      // if able to geocode the address
      if(data_arr){
        var ne_latitude = data_arr[0];
        var ne_longitude = data_arr[1];
        var sw_latitude = data_arr[2];
        var sw_longitude = data_arr[3];
        var formatted_address = data_arr[4];
        var cn_latitude = data_arr[5];
        var cn_longitude = data_arr[6];
        
        var f_temp = formatted_address.split(", ");
        var g_temp = f_temp[1].split(" ");
        var folder_name = f_temp[0] + '_'+ g_temp[0];


        pg.connect(conString,function(err,client,done){
        
        client.query("INSERT INTO \"Area_info\" (\"Address\", \"LatLong\", \"Folder_Name\") Values($1, '(("+$2+","+$3+"),("+$4+","+$5+"))', $6)",[formatted_address,ne_latitude,ne_longitude,sw_latitude,sw_longitude,folder_name],function(err,result){
        done();
        if(err) {
           return console.error('error running query', err);
          }
        })});
      res.render('abs');
      }
      else{
        res.end("no such village found");
          }
      
      }
    
      else{
        res.render('template', {view_data});//sending json as var to another page
      }
      
  });
    
  }); 
  //res.redirect('nextq');
  //res.end('yes');


});


//------------------------------------------VILLAGE NOT FOUND---------------------------------------------------------------
ws.post('/newq',function(req,res){
  var humans = req.body.InputHumans;
  var live = req.body.InputLivestock;
  var inc = req.body.InputIncome;
  var ins = req.body.InputIns;
  var gw = req.body.check1;
  var rw = req.body.check2;
  var dis = req.body.dis;

  
  if(!(humans = null) || !(live = null) || !(inc = null)|| !(ins = null)|| !(gw = null)|| !(rw = null)|| !(dis = null))
  {
  pg.connect(conString,function(err,client,done){
  if(err){
    return console.error('Could not connect to postgres' , err);
  }
    client.query("INSERT INTO \"civil\" (humans, livestock,Income,institutions,ground_water,river_water,distance) VALUES ($1, $2, $3, $4, $5, $6 ,$7)", [humans, live, inc, ins, gw,rw ,dis], function(err,result){
    done();
    if(err) {
      return console.error('error running query', err);
    }
    else{
      res.render('thanks');
      var process = spawn('python',['./first.py', 1 ,2]);//creating child process to run in background while server listens to other requests
      process.stdout.on('data', function (data){
      console.log("python script ends now..!!!" + data);//for printing process output
      });
      process.stderr.on('data', function(data){
      console.log('stderr : ' + data);//for printing error
      });
      process.on('close',function(code){
      console.log('child process exited with this code' + code);
      pdfgen.report();//calling pdf generation
      });
    
    }
  })
    
  }) 
  

}
});
//------------------------------------------Check status-------------------------------------------------------------
ws.post('/checks',function(req,res){
  var mobile_no = req.body.Mobile_Number1;
  var q_id = req.body.Query_id1;

  pg.connect(conString,function(err,client,done){
  if(err){
    return console.error('Could not connect to postgres' , err);
  }
    var results = [];
    var query = client.query("SELECT * FROM  \"Area_info\" WHERE \"q_id\" = $1",[q_id]);
    query.on('row', function(row) {
            results.push(row);
        });
    query.on('end', function() {
            done();
            var view_data = JSON.parse(JSON.stringify(results));
          if(view_data.length == 0)
      {  
      res.render('noquery');
      }
      else{
        res.render('template', {view_data});
      }
      
  });
    
  }); 
  


});
//----------------------------------------admin page--------------------------------
ws.post('/adminpg',function(req,res){
  var name = req.body.inputname;
  var pass = req.body.inputPassword;
 
  pg.connect(conString,function(err,client,done){
  if(err){
    return console.error('Could not connect to postgres' , err);
  }
  var results = [];
    var query = client.query("SELECT \"pass\" FROM  \"Users\" WHERE \"name\" = ($1)",[name])
    query.on('row', function(row) {
            results.push(row);
        });
    query.on('end', function() {
            done();
            var view_data = JSON.parse(JSON.stringify(results));
            for(var d=0 ; d<view_data.length; d++){
              var checkpass = view_data[d].pass;
            }
            
            if(checkpass == pass)
            {
              var view_data1 = [];
              res.render('adminpg', {view_data1});
            }
            else{
            res.render('admin', {msg : 'wrong password..try again'});
            }
      
        });
   
      
    
    
});

});
//----------------------------------------admin browse---------------------------------->>
ws.get('/browse',function(req,res){
  pg.connect(conString,function(err,client,done){
  if(err){
    return console.error('Could not connect to postgres' , err);
  }
    var results1 = [];
    var query1 = client.query("SELECT * FROM  \"Area_info\" ");
    query1.on('row', function(row) {
            results1.push(row);
        });
    query1.on('end', function() {
            done();
            var view_data1 = JSON.parse(JSON.stringify(results1));
            
          if(view_data1.length == 0)
      {  
      res.end('no queries to show');
      }
      else{
        res.render('adminpg', {view_data1});
      }
      
  });
    
  }); 
  


});

//----------------------------------------admin review---------------------------------->>
ws.get('/review',function(req,res){
  pg.connect(conString,function(err,client,done){
  if(err){
    return console.error('Could not connect to postgres' , err);
  }
    var results1 = [];
    var query1 = client.query("SELECT * FROM  \"Area_info\" ");
    query1.on('row', function(row) {
            results1.push(row);
        });
    query1.on('end', function() {
            done();
            var view_data1 = JSON.parse(JSON.stringify(results1));
          if(view_data1.length == 0)
      {  
      res.end('no queries to show');
      }
      else{
        res.render('review', {view_data1});
      }
      
  });
    
  });
  }); 
  

//--------------------------------------admin delete----------------------------->>
ws.post('/delete',function(req,res){
  var del =  req.body.deleted
  pg.connect(conString,function(err,client,done){
  if(err){
    return console.error('Could not connect to postgres' , err);
  }
    var view_data1 = [];
    var query2 = client.query("DELETE FROM  \"Area_info\" WHERE \"Folder_Name\" = ($1)",[del]);
    query2.on('end', function() {
            done();
           });
    if(err)
    {
      console.log("error running query");
      res.end('error running query');
    }
    else
    {
      res.render('adminpg', {view_data1});
    }       
  });
    
  }); 
  
  //--------------------------------------admin review done----------------------------->>
ws.post('/revdone',function(req,res){
  var rev =  req.body.review;
  var vill = req.body.hidden;
  console.log(rev);
  console.log(vill);
  pg.connect(conString,function(err,client,done){
  if(err){
    return console.error('Could not connect to postgres' , err);
  }
    var view_data1 = [];
    var query2 = client.query("UPDATE \"Area_info\" SET \"status\" = ($1) WHERE \"Folder_Name\" = ($2)",[rev,vill]);
    query2.on('end', function() {
            done();
           });
    if(err)
    {
      console.log("error running query");
      res.end('error running query');
    }
    else
    {
      res.render('adminpg', {view_data1});
    }       
  });
    
  });


//----------------------------------------activating server to listen on a particular port mentioned on line no 8
ws.listen(port,function(){
  console.log("listening on the port" + port)
});
