const path = require("path");
const express = require("express");
const model_creator = require("./model");

const port = process.env.PORT || 8080;
const app = express();
const model = model_creator(process.env.MSKEY);

app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next) => {
    app.model = model;
    next();
});

app.get('/recent', (req, res) => {
    model.getRecent(10, (err, data)=>{
        if(err){
            console.log(err);
            res.send("Error search: " + err);
        }
        else{
            res.send(JSON.stringify(data));
        }
    });
});

app.get('/img/:text', (req, res) => {
    var search_text = req.params.text;
    var per_page = req.query.size || 10;
    var page_num = req.query.offset || 0;
    
    model.saveQuery(search_text, Date.now(), function(err){
        if(err){
            console.log(err);
            res.send("Error search: " + err);
        }
        else{
            model.getImages(search_text, per_page, page_num, (err, data)=>{
                if(err){
                    console.log(err);
                    res.send("Error search: " + err);
                }
                else{
                    res.send(JSON.stringify(data));
                }
            });
        }
    });
});

app.listen(port);