const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended : true })); // body 부분 예를들어 input 에서 요청한 데이터 해석을 쉽게 도와주는 라이브러리 bodyParser

app.listen(8080, () => {
    console.log('listening on 8080');
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
});


