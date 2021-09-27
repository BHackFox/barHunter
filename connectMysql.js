var mysql = require('mysql');
const express = require('express');
const querystring = require('querystring');
var fs = require('fs');
const bodyParser = require('body-parser');
var path = require('path');



var  getInformationFromDB = function(callback){}

const app = new express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
var con = mysql.createConnection({
  host: "localhost",
  user: "myBar",
  password: "myBarPassword",
  database: "mainBar"
});

app.get('/local_city/',(req,res)=>{
    con.connect(function(err){
        var parsered = req.query;
        var html = '';
        con.query("SELECT * FROM mainBars WHERE city_name LIKE ?",[parsered.city+"%"],function(err,result,field){
            if(err) throw err;
            for(var i=0;i<result.length;i++){
              html += "<div><h1>"+result[i].city_name+"</h1><h1>"+result[i].n_bar+"</div>"
              html += '<a href="/bar_for_city/?city='+result[i].city_name+'"><button>Search Bars</button></a>'
            }
            res.send(html);
        })
    })
})

app.get('/bar_for_city/',(req,res)=>{
    con.connect(function(err){
        var parsered = req.query;
        var html = '';
        con.query("SELECT * FROM "+parsered.city+"_Table ORDER BY stars DESC",function(err,result,field){
            if(err) throw err;
            for(var i=0;i<result.length;i++){
              html += "<div><h1>"+result[i].bar_name+"</h1></div>"
            }
            res.send(html);
        })
    })
})

app.get('/create_city/:id',(req,res)=>{
    con.connect(function(err){
        var parsered = querystring.parse(req.params.id);
        var sql = "INSERT INTO mainBars (city_name, position, n_bar) VALUES (?,?,?)";
        con.query(sql,[parsered.city,parsered.place,'1'],function(err,result){
            if(err) throw err;
        })
        con.query("CREATE DATABASE "+parsered.city,function(err,result){
            if(err) throw err;
        })
        var sql = "CREATE TABLE "+parsered.city+"_Table (id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY, bar_name VARCHAR(60), description VARCHAR(60), location VARCHAR(60), opening VARCHAR(60), closing VARCHAR(60), stars VARCHAR(60))";
        con.query(sql,function(err,result){
            if(err) throw err;
        })
        var sql = "CREATE TABLE "+parsered.city+".products (id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY, product VARCHAR(60), description VARCHAR(60), bar_name VARCHAR(60), price VARCHAR(60))";
        con.query(sql,function(err,result){
            if(err) throw err;
            res.send(result);
        })
    })
	//res.send("Response about user "+req.params.city)
})

app.get('/insert_bar/:id',(req,res)=>{
    con.connect(function(err){
        var parsered = querystring.parse(req.params.id);
        var sql = "INSERT INTO "+parsered.city+"_Table (bar_name, description, location, opening, closing, stars) VALUES (?,?,?,?,?,?)";
        con.query(sql,[parsered.name,parsered.description,parsered.location,parsered.opening, parsered.closing,parsered.stars],function(err,result,field){
            if(err) throw err;

        })
        var sql = "CREATE TABLE "+parsered.city+"."+parsered.name.replace(/\s/g, '_')+" (id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY, product VARCHAR(60), description VARCHAR(60), price VARCHAR(60), stars VARCHAR(60))";
        con.query(sql,function(err,result){
            if(err) throw err;
        })
        var numb=0;
        var sql1 = "SELECT n_bar FROM mainBars WHERE city_name=?";
        con.query(sql1,[parsered.city],function(err,result,fields){
            if(err) throw err;
            numb = result[0].n_bar+1;
            var sql2 = "UPDATE mainBars SET n_bar=? WHERE city_name=?";
            con.query(sql2,[numb,parsered.city],function(err,result){
                if(err) throw err;
                res.send(result);
            });
        });
    })
	//res.send("Response about user "+req.params.city)
})

app.get('/add_product/:id',(req,res)=>{
    con.connect(function(err){
        var parsered = querystring.parse(req.params.id);
        var sql = "INSERT INTO products (product, description, numbers_in_bars, medium_cost, img_url) VALUES(?,?,?,?,?)";
        con.query(sql,[parsered.product,parsered.description,0,0,parsered.img_url],function(err,result){
            if(err) throw err;
            res.send(result);
        })
    })
})

app.get('/add_product_to_bar/:id',(req,res)=>{
    con.connect(function(err){
        var parsered = querystring.parse(req.params.id);
        var sql = "INSERT INTO "+parsered.city+"."+parsered.name.replace(/\s/g, '_')+" (product, description, price, stars) VALUES(?,?,?,?)";
        con.query(sql,[parsered.product,parsered.description,parsered.price,parsered.stars],function(err,result){
            if(err) throw err;

        })
        var sql = "INSERT INTO "+parsered.city+".products (product, description, bar_name, price) VALUES(?,?,?,?)";
        con.query(sql,[parsered.product,parsered.description,parsered.name,parsered.price],function(err,result){
            if(err) throw err;
            res.send(result);
        })
    })
})

app.get('/show_product_by_name', (req,res)=>{
    con.connect(function(err){
        var parsered = req.query;
        var sql = "SELECT * FROM products WHERE product LIKE ?";
        var html = '';
        con.query(sql,[parsered.search+"%"],function(err,result){
            if(err) throw err;
            if(result.length>0){
                for(var i=0;i<result.length;i++){
                    html += '<img src="../images/'+result[i].img_url.replace(/\s/g, '/')+'" alt="'+result[i].product+'"width="200" height="200">';
                }
                res.send(html)
            }
            else{
                var sql = "SELECT product,img_url FROM products";
                con.query(sql,[parsered.search],function(err,result){
                    if(err) throw err;

                    console.log(result);
                    for(var i=0;i<result.length;i++){
                        html += '<div>'
                        html += '<a>'+result[i].product+'</a><img src="../images/'+result[i].img_url.replace(/\s/g, '/')+'" alt="'+result[i].product+'" width="200" height="200">';
                    }

                    res.send(html);
                })
            }
        })
    })
})

app.get('/images/:img', (req,res)=>{
    var img = fs.readFileSync('images/'+req.params.img);
    res.writeHead(200, {'Content-Type': 'image/gif' });
    res.end(img, 'binary');
})

app.get('/show_bar_by_city/:id',(req,res)=>{
    var parsered = querystring.parse(req.params.id);
    var sql = "SELECT * FROM "+parsered.search+"_Table";
    con.query(sql,[parsered.search],function(err,result){
        if(err) throw err;
        console.log(result);
        res.send(result);
    })
})

app.get('/show_product_by_city/:id',(req,res)=>{
    var parsered = querystring.parse(req.params.id);
    var html = '';
    var ext = 0;
    getProducts(parsered.city,function(result){
      for(var i=0;i<result.length;i++){

        getProduct(result[i].product,function(data){
          html += '<img src="../images/'+data[0].img_url.replace(/\s/g, '/')+'" alt="'+data[0].product+'"width="200" height="200">';
          ext += 1;
          console.log(ext,result.length);
          if(ext==result.length){
            res.send(html)
          }
        });
      }
    });
})

function getProducts(city,callback){
    con.query("SELECT * FROM "+city+".products", function(err, result){
        if(err) throw err;
        return callback(result);
    })

}

function getProduct(product, callback){
    con.query("SELECT img_url FROM products WHERE product=?",[product], function(err, result){
        if (err) throw err;
        callback(result);
    });
}
// SELECT suppliers.suppler_name, orders.order_id
// FROM suppliers, orders
// WHERE suppliers.supplier_id = orders.supplier_id
// AND suppliers.state = 'California';

app.get('/',(req,res)=>{
    //res.writeHead(200, {'Content-Type': 'text/html' });
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.listen(port,()=>{
	console.log('listen at 127.0.0.1')
})
