const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended : true })); // body 부분 예를들어 input 에서 요청한 데이터 해석을 쉽게 도와주는 라이브러리 bodyParser

const MongoClient = require('mongodb').MongoClient;

var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@pci.bvm9dz3.mongodb.net/?retryWrites=true&w=majority', function(err, client){
    //연결되면 할 일
    if(err) return console.log(err);
    db = client.db('todoapp'); // todoapp 이라는 database에 연결
    
    // 외워서 필요할 때 가져다 쓰면 됨
    // todoapp 이라는 database 안에 post 폴더에 insertOne { 자료 } 저장
    // 자료 저장시 _id 꼭 적어야 함, 안적으면 강제로 부여됨
    // db.collection('post').insertOne( {제목 : '제목', 날짜 : syedate, 나이 : 20}, function(err, succ) { 
    //     console.log('저장 완료!!!');
    // });

    app.listen(8080, () => {
        console.log('listening on 8080');
    });
});



app.get('/pet', (req, res) => {
    res.send("고양이 용품 판매 페이지입니다.");
});

app.get('/beauty', (req, res) => {
    res.send("화장품 판매 페이지입니다.");
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/write', (req, res) => {
    res.sendFile(__dirname + '/write.html');
});

app.post('/add', (req, res) => { // post 요청으로 서버에 데이터 전송하고 싶으면 bodyParser 라이브러리 install
    res.send('전송 완료');
    console.log(req.body.title); // req.body 요청했던 form 에 들어간 데이터 수신받은 것 중에 name = title
    console.log(req.body.date);
    db.collection('post').insertOne({ 제목 : req.body.title, 날짜 : req.body.date }, function(err, result) {
        console.log('저장 완료');
    });
});