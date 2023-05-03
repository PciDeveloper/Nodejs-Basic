const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended : true })); // body 부분 예를들어 input 에서 요청한 데이터 해석을 쉽게 도와주는 라이브러리 bodyParser
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs'); // html 말고도 ejs 파일을 사용할 수 있는데 서버 데이터를 집어넣을 수가 있음 <%=  %> 이런 방식 views 폴더 만들고 그 안에서 작업
app.use('/public', express.static('public')); // 미들웨어 => static 파일을 보관하기 위해 public 폴더를 사용한다고 명시

var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@pci.bvm9dz3.mongodb.net/?retryWrites=true&w=majority', function(err, client){
    //연결되면 할 일
    if(err) return console.log(err);
    db = client.db('todoapp'); // todoapp 이라는 database에 연결

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
    res.render('index.ejs');
});

app.get('/write', (req, res) => {
    res.render('write.ejs');
});

// collection 은 필요할 때 가져다 쓰면 됨
// post 요청으로 서버에 데이터 전송하고 싶으면 bodyParser 라이브러리 install
app.post('/add', (req, res) => { // form 태그에서 post 방식으로 /add 요청이 있을 시
    res.send('전송 완료'); // 전송완료라는 응답을 해줌
    console.log(req.body.title); // req.body 요청했던 form 태그에 들어간 데이터 수신받은 것 중에 name = title
    console.log(req.body.date); // req.body 요청했던 form 태그에 들어간 데이터 수신받은 것 중에 name = date

    db.collection('counter').findOne({ name : '게시물갯수' }, function(err, result) { // db 에서 counter 라는 파일에 저장된 name 이 게시물갯수라는 것을 찾아주세요
        console.log(result.totalPost); // 위의 결과 result 에서 totalPost 저장된 오브젝트 데이터 중 totalPost(게시물갯수)를 찾아주세요
        let totalCount = result.totalPost; // 찾은 결과를 totalCount 라는 변수에 담았음

        // todoapp 이라는 db 안에 post 파일에 insertOne { 자료 } 저장
        // 자료 저장시 _id 꼭 적어야 함, 미작성시 강제로 부여됨
        // 위에서 결과를 담은 변수를 _id 에 + 1 시켜서 부여함 
        db.collection('post').insertOne({ _id : totalCount + 1, 제목 : req.body.title, 날짜 : req.body.date }, function(err, result) {
            console.log('저장 완료');

            // counter 라는 db 폴더에 따로 관리하는 totalPost : 0 데이터에도 + 1 증가시켜주는 로직
            // updateOne({어떤 데이터를 수정할지}, {수정할 값}, function(에러, 결과){})
            // 연산자 (operator) 종류
            // $set => 값을 바꿔주세요 요청을 하고싶을 때 사용 방법 => { $set : { totalPost : 바꿀 값 }}
            // $inc => 기존 값에서 증가해주세요 increment 의 약자, 사용 방법 => { $set : { totalPost : 기존값에 증가해줄 값 }}
            // 그리고 뒤에 콜백함수는 이전꺼 동작 후 실행해주는 함수. 항상 첫번째 파라미터는 에러, 두번째 파라미터는 결과
            db.collection('counter').updateOne({ name : '게시물갯수'}, { $inc : { totalPost : 1 }}, function(err, result){
                if(err) {
                    return console.log(err); 
                }
            });
        });
    });
});

app.get('/list', (req, res) => {
    // database 에 저장된 post 라는 collection 안에 모든 데이터를 꺼내는 방법
    db.collection('post').find().toArray( (err, result) => {
        // console.log(result);
        res.render('list.ejs', { posts : result });
    }); 
});

// ajax delete 삭제 요청이 왔을 때
app.delete('/delete', (req, res) => {
    console.log(req.body);
    req.body._id = parseInt(req.body._id); // ajax 로 보낼 때 int 로 보냈지만 값이 넘어올 때 스트링으로 왔으므로 int 로 다시 변환
    // req.body에 담겨온 게시물 번호를 가진 글을 db 에서 찾아서 삭제
    db.collection('post').deleteOne(req.body, function(err, result) {
        console.log('삭제완료');
        res.status(200).send({ message : 'DB 삭제처리 성공 !!!' });
    });
});

app.get('/detail/:id', (req, res) => { // /detail/:id 으로 라우팅
    // req.params.id => url에 파라미터중에서 id 라고 이름지은 파라미터를 넣어주세요
    // 그러나 db post 라는 폴더에 있는 데이터 중 _id 는 int 이므로 int 로 변환을 시켜줘야함
    db.collection('post').findOne( { _id : parseInt(req.params.id) }, function(err, result) { 
        if(result){
            res.render('detail.ejs', { data : result }); // ejs 파일에 값 넘길 때 object 형식으로 값이 전달됨
        } else {
            console.log('찾으시는 데이터가 없습니다.');
            res.render('404.ejs');
        }
    });
});


app.get('/update/:id', function(req, res) {
    db.collection('post').findOne( { _id : parseInt(req.params.id) }, function(err, result) {
        if(result) {
            console.log(result);
            res.render('update.ejs', { post : result });
        } else {
            console.log('찾으시는 데이터가 없습니다.');
            res.render('404.ejs');
        }
    });
});

app.put('/update', (req, res) => {
    // updateOnde( {어떤게시물을 수정할건지}, {수정값}, {콜백함수} )
    // form 에서 전송한 제목, 날짜로 db.collection('post') 에서 게시물 찾아서 업데이트 처리
    // $set => 값을 바꿔주세요 요청을 하고싶을 때 사용 방법 => { $set : { totalPost : 바꿀 값 }}
    // req.body.id 에서 .id 는 form 에 담겨온 input 에 name 값을 말함
    db.collection('post').updateOne( { _id : parseInt(req.body.id) }, { $set : { 제목 : req.body.title, 날짜 : req.body.date } }, function() {
        console.log('수정완료');
        res.redirect('/list');
    });
});
