
// 서버 구동 => 터미널에서 nodemon server.js localhost:8080
// mongo atlas => https://cloud.mongodb.com/v2/63fc3cad917d2266e84c05c1#/overview
// mongo atlals 접속 후 왼쪽 Project0 선택 되어있는지 확인 후 database 클릭 => Browse Collections 클릭

// app.use(미들웨어) => 요청 - 응답 중간에 무언가 실행되는 코드
// 즉, 미들웨어를 사용하고 싶을 때. 전역 미들웨어
const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended : true })); // body 부분 예를들어 input 에서 요청한 데이터 해석을 쉽게 도와주는 라이브러리 bodyParser
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs'); // html 말고도 ejs 파일을 사용할 수 있는데 서버 데이터를 집어넣을 수가 있음 <%=  %> 이런 방식 views 폴더 만들고 그 안에서 작업
app.use('/public', express.static('public')); // 미들웨어 => static 파일을 보관하기 위해 public 폴더를 사용한다고 명시

// session 방식의 로그인 기능 구현 라이브러리
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
app.use(session({ secret : '비밀코드', resave : true, saveUninitialized : false}));  // secret 세션을 만들 때 비밀번호
app.use(passport.initialize());
app.use(passport.session());

// Socket.io 실시간 데이터 보내고 받는 라이브러리 설치하는 문법
const http = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(http);

var db; // 전역변수
// MongoClient.connect('mongodb+srv://admin:qwer1234@pci.bvm9dz3.mongodb.net/?retryWrites=true&w=majority', function(err, client){
    MongoClient.connect(process.env.DB_URL, function(err, client){ // 이와 같이 .env 파일 만들어서 관리
    //연결되면 할 일
    if(err) return console.log(err);
    db = client.db('todoapp'); // todoapp 이라는 database에 연결

    // 쌩 nodejs 로 서버를 띄울때 http.listen 을 쓰지만 express 라는 라이브러리를 사용하고 있으므로 app.listen 을 사용했었음
    // 동일한 기능을 하기 떄문에 둘의 별 차이는 없음
    // app.listen(8080, () => {
    http.listen(8080, () => { 
        console.log('listening on 8080');
    });
});

app.get('/socket', function(req, res) {
    res.render('socket.ejs');
});

// 어떤 사람이 socket.ejs web socket 에 접속하면 동작
io.on('connection', function(socket) { // 유저가 보낸 메세지 수신하기 위해 socket 파라미터 추가
    console.log('유저 접속함');
    console.log('socket 에 접속한 유저 : ' + socket.id);

    // 유저가 room1-send 라는 이름으로 메세지를 서버로 보내오면 동작하는 이벤트 리스너
    socket.on('room1-send', function(data) { 

        // 유저가 room1 채팅방 입장 요청을 하면 유저에게 채팅방도 생성해주고 "room1 에 입장한 유저들에게만" 전송됨
        io.to('room1').emit('broadcast', data);
    });

    // socket.ejs 에서 유저가 서버에 메세지 보내기 버튼을 누르면 그 값을 받아와서 출력
    // 유저가 joinroom 라는 이름으로 메세지를 서버로 보내오면 동작하는 이벤트 리스너
    // 보내온 데이터는 data 파라미터에 있음
    socket.on('joinroom', function(data) { 

        // 유저가 room1 채팅방 입장 요청을 하면 유저에게 채팅방도 생성해주고 입장시켜줌
        socket.join('room1');
    });

    // socket.ejs 에서 유저가 서버에 메세지 보내기 버튼을 누르면 그 값을 받아와서 출력
    // 유저가 user-send 라는 이름으로 메세지를 서버로 보내오면 동작하는 이벤트 리스너
    // 보내온 데이터는 data 파라미터에 있음
    socket.on('user-send', function(data) { 
        console.log(data); // 유저가 보내온 데이터
        // io.emit() 접속한 모든 유저에게 메세지를 똑같이 보내줌 broadcast 한다 라는 관습적인 의미
        // 접속자간에 단체 채팅방 완성임.
        io.emit('broadcast', data);

        // 아래 로직이면 socket.id 를 가진 유저한테만 보낼 수 있음
        // socket.ejs 에 접속한 유저 정보가 socket 파라미터에 담겨있음
        // io.to(socket.id).emit('broadcast', data);
    });

});

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/list', loginChk, (req, res) => {
    // database 에 저장된 post 라는 collection 안에 모든 데이터를 꺼내는 방법
    db.collection('post').find().toArray( (err, result) => {
        // console.log(result);
        res.render('list.ejs', { posts : result } );
    }); 
});

app.get('/detail/:id', (req, res) => { // /detail/:id 으로 라우팅
    // req.params.id => url에 파라미터중에서 id 라고 이름지은 파라미터를 넣어주세요
    // 그러나 db post 라는 폴더에 있는 데이터 중 _id 는 int 이므로 int 로 변환을 시켜줘야함
    db.collection('post').findOne( { _id : parseInt(req.params.id) }, function(err, result) { 
        if(result){
            res.render('detail.ejs', { data : result } ); // ejs 파일에 값 넘길 때 object 형식으로 값이 전달됨
        } else {
            console.log('찾으시는 데이터가 없습니다.');
            res.render('404.ejs');
        }
    }); // findOne
});

// url 에 id 값 요청이 있을 때
app.get('/update/:id', function(req, res) {
    db.collection('post').findOne( { _id : parseInt(req.params.id) }, function(err, result) {
        if(result) {
            console.log(result);
            res.render('update.ejs', { post : result } );
        } else {
            console.log('찾으시는 데이터가 없습니다.');
            res.render('404.ejs');
        }
    }); // findOne
}); // update

// update 수정 작업
app.put('/update', (req, res) => {
    // updateOnde( {어떤게시물을 수정할건지}, {수정값}, {콜백함수} )
    // form 에서 전송한 제목, 날짜로 db.collection('post') 에서 게시물 찾아서 업데이트 처리
    // $set => 값을 바꿔주세요 요청을 하고싶을 때 사용 방법 => { $set : { totalPost : 바꿀 값 }}
    // req.body.id 에서 .id 는 form 에 담겨온 input 에 name 값을 말함
    db.collection('post').updateOne( { _id : parseInt(req.body.id) }, { $set : { 제목 : req.body.title, 날짜 : req.body.date } }, function(err, result) {
        console.log('수정완료');
        res.redirect('/list');
    }); // updateOne
});

// 회원가입
app.get('/join', function(req, res) {
    res.render('join.ejs');
});

app.post('/join', (req, res) => {
    console.log(req.body.id); // req.body 요청했던 form 태그에 들어간 데이터 수신받은 것 중에 name = title
    console.log(req.body.pw); // req.body 요청했던 form 태그에 들어간 데이터 수신받은 것 중에 name = date

    db.collection('member').findOne( { id : req.body.id }, function(err, result) {
        // form 에 담겨져 온 req.body.id 값이 db 에 있는지 없는지 결과 result 에 담김
        // 그 result 값이 null 이 아니거나, form 데이터 (req.body.id) 와 결과 값 중 id 와 같으면, 즉 폼 데이터가 디비에 있는 데이터와 같으면 아이디 중복
        // 정리하면.. req.body.id 폼 데이터를 조회했을 때 결과값이 있고, db 에도 값이 있으면 아이디 중복
        // null 처리 안해서 오류났었음
        if (result !== null && req.body.id === result.id) { 
            console.log('아이디 중복');
            return false;
        } else {
            db.collection('member').insertOne( { id : req.body.id, pw : req.body.pw }, function(err, result) {
                console.log('회원가입 성공');
                // res.redirect('/');
            }); // insertOne
        }
    }); // findOne
}); // join

// 회원가입 /join 로직 만들어놔서 이 부분은 사용 보류
// 회원가입을 하면 로그인 컬렉션에 insert
app.post('/register', function(req, res) {
    db.collection('login').insertOne( { id : req.body.id, pw : req.body.pw }, function(err, result) {
        res.redirect('/');
    });
});

app.get('/login', function(req, res) {
    res.render('login.ejs');
});

// passport 라이브러리 미들웨어 사용하여 local 방식으로 검사, 검사하는 코드는 바로 아래 로직
// 로그인을 시도하면 아이디, 비밀번호 검사
// failureRedirect 회원 인증 실패시 fale 경로 이동
app.post('/login', passport.authenticate('local', { failureRedirect : '/fale' } ), (req, res) => {
    res.redirect('/');
});

// 아이디, 비밀번호를 검사하는 로직
// 로그인 post 요청, form 을 전송할 때 검사해주는 로직
// LocalStrategy => 인증하는 방법
// done() => 3개의 파라미터를 사용함. done(서버에러, 성공시 사용자 db 데이터) 
passport.use(new LocalStrategy({
    usernameField : 'id', // input name = id
    passwordField : 'pw', // input name = pw
    session : true, // 로그인 후 세션을 저장할 것인지 여부
    passReqToCallback : false,
}, function(입력한아이디, 입력한비밀번호, done) {
    console.log(입력한아이디, 입력한비밀번호);
    db.collection('login').findOne( { id : 입력한아이디 }, function(err, result) {
        if (err) return done(err);
        if (!result) return done(null, false, { message : '존재하지 않는 회원입니다.' } ); // 데이터가 일치하지 않을 때에는 두번째 파라미터에 false 넣어야 함
        if (입력한비밀번호 == result.pw) { // db 에 아이디가 있으면, 해당 아이디와 db의 비밀번호가 맞는지 체크
            return done(null, result); // 성공하면 result 에 결과를 뱉어냄
        } else {
            return done(null, false, { message : '비밀번호가 일치하지 않습니다.'} ); // 데이터가 일치하지 않을 때에는 두번째 파라미터에 false 넣어야 함
        }
    });
}));

// 유저 정보를 세션에 저장시키는 로직 => 로그인 성공시 동작
// 콜백 함수 안에 파라미터 user 는 위의 결과값 result 가 담겨있음 => id, pw 검증 성공 결과
// 위에서 인증 성공하면 세션 + 쿠키 만들어줌
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// 나중에 호출되는 로직 (마이페이지 이동시 동작)
// deserializeUser => 세션을 찾을 때 실행
// db 에서 위에 있는 user.id 로 유저를 찾은 다음 그 정보를 {} 에 넣음
// user.id == 아이디 동일한 데이터
passport.deserializeUser(function(아이디, done) {
    db.collection('login').findOne( { id : 아이디 }, function(err, result) {
        done(null, result);
    });
});

app.get('/write', (req, res) => {
    res.render('write.ejs');
});

// collection 은 필요할 때 가져다 쓰면 됨
// post 요청으로 서버에 데이터 전송하고 싶으면 bodyParser 라이브러리 install
app.post('/write', (req, res) => { // form 태그에서 post 방식으로 /write 요청이 있을 시
    res.send('전송 완료'); // 전송완료라는 응답을 해줌
    console.log(req.body.title); // req.body 요청했던 form 태그에 들어간 데이터 수신받은 것 중에 name = title
    console.log(req.body.date); // req.body 요청했던 form 태그에 들어간 데이터 수신받은 것 중에 name = date

    db.collection('counter').findOne( { name : '게시물갯수' }, function(err, result) { // db 에서 counter 라는 파일에 저장된 name 이 게시물갯수라는 것을 찾아주세요
        console.log(result.totalPost); // 위의 결과 result 에서 totalPost 저장된 오브젝트 데이터 중 totalPost(게시물갯수)를 찾아주세요
        
        // 찾은 결과를 totalCount 라는 변수에 담았음
        var totalCount = result.totalPost; 
        
        // 작성자 => 현재 로그인 한 사람의 _id 정보
        var 저장할항목 = { _id : totalCount + 1, 작성자 : req.user._id, 제목 : req.body.title, 날짜 : req.body.date } 

        // todoapp 이라는 db 안에 post 파일에 insertOne { 자료 } 저장
        // 자료 저장시 _id 꼭 적어야 함, 미작성시 강제로 부여됨
        // 위에서 결과를 담은 변수를 _id 에 + 1 시켜서 부여함 
        db.collection('post').insertOne( 저장할항목, function(err, result) {
            console.log('저장 완료');
            console.log('result');
            // counter 라는 db 폴더에 따로 관리하는 totalPost : 0 데이터에도 + 1 증가시켜주는 로직
            // updateOne({어떤 데이터를 수정할지}, {수정할 값}, function(에러, 결과){})
            // 연산자 (operator) 종류
            // $set => 값을 바꿔주세요 요청을 하고싶을 때 사용 방법 => { $set : { totalPost : 바꿀 값 }}
            // $inc => 기존 값에서 증가해주세요 increment 의 약자, 사용 방법 => { $set : { totalPost : 기존값에 증가해줄 값 }}
            // 그리고 뒤에 콜백함수는 이전꺼 동작 후 실행해주는 함수. 항상 첫번째 파라미터는 에러, 두번째 파라미터는 결과
            db.collection('counter').updateOne( { name : '게시물갯수' }, { $inc : { totalPost : 1 } }, function(err, result){
                if(err) {
                    return console.log(err); 
                }
            }); // updateOne
        }); // insertOne
    }); // findOne
});

// ajax delete 삭제 요청이 왔을 때
app.delete('/delete', (req, res) => {
    console.log(req.body);

    // ajax 로 보낼 때 int 로 보냈지만 값이 넘어올 때 스트링으로 왔으므로 int 로 다시 변환
    req.body._id = parseInt(req.body._id); 

    // 실제 로그인 중인 유저 _id 와, 글에 저장된 _id 가 일치하는 것만 삭제
    var 삭제할데이터 = { _id : req.body._id, 작성자 : req.user._id } 

    // req.body에 담겨온 게시물 번호를 가진 글을 db 에서 찾아서 삭제
    db.collection('post').deleteOne(삭제할데이터, function(err, result) {
        console.log('삭제완료');
        if(result) { console.log(result) }
        res.status(200).send( { message : 'DB 삭제처리 성공 !!!' } );
    }); // deleteOne
});

// mypage 페이지 요청을 하면 loginChk 실행 후 응답
// loginChk 미들웨어 사용법, 위에 로그인 할 때 같은 방법 사용 했었음
// deserializeUser 에서 찾은 정보를 mypage.ejs 에 보내줌
app.get('/mypage', loginChk, function(req, res) {
    console.log(req.user);

    // req.user => 아래 로직에 있는 user
    res.render('mypage.ejs', { 사용자 : req.user } ); 
});

// 미들웨어 함수 만들기
// 로그인 후 세션이 있으면 요청.user 는 항상 있음
function loginChk (req, res, next) {
    if (req.user) { // 요청.user 가 있는지 여부 체크
        next(); // 통과
    } else {
        res.send('로그인 후 이용해주세요.');
    }
}

// list.ejs 에서 검색 후 search 요청이 왔을 때
app.get('/search', (req, res) => {
    // 기존에 body 안에 값을 가져올 때는 req.body.id 이런식으로 가져왔는데
    // 서버에서 query string 을 꺼내올 때 query 로 꺼내옴
    // req.query => { value: '게시물' }
    // req.query.value 에서 .value 는 object 자료형에서 데이터를 꺼내는 방식 => 게시물
    console.log(req.query.value);
    // Binary Search 를 적용하려면 미리 숫자 정렬이 되어있어야 함
    // mongodb 는 _id 순으로 미리 정렬이 되어있음
    // index : 기존 collection 을 정렬 해 놓은 사본
    // 미리 정렬해두면 (indexing) db 는 알아서 Binary Search 를 해줌
    // indexing 하는 방법은 MongoDB Compass 에서 해당 거넥션 선택 후 indexes 클릭 후 create index
    // $text, $search 연산자 (operator)
    // db 에서 index 추가할 때 텍스트 text index 를 만들어 놓으면 자동적으로 쓸 수 있는 기능 => mongoDB 기능
    // 하지만 text index 의 문제점은 띄어쓰기 기준으로 구별하기 때문에 한글 친화적이지 않음 => 글쓰기입니다 => 글쓰기로 검색하면 안나옴
    // db.collection('post').find({ $text: { $search : req.query.value } }).toArray((err, result) => {
    // aggregate({1~10일까지 찾기}, { '글쓰기라는' 단어가 포함된것을 }, { 결과를 정렬 }) != text index 와의 차이점
    var 검색조건 = [
        {
            $search : {
                index : 'titleSearch', // 만든 인덱스 명
                text : {
                    query : req.query.value,
                    path : ['제목', '날짜'] // 컬렉션 안에 있는 데이터 중에 어떤 항목에서 검사를 할 것인지
                }
            }
        },
        { $sort : { _id : 1} }, // _id(번호) 정렬
        { $limit : 5 }, // 게시글 갯수 제한
        // 0, 1 로 가져오고 안가져오고 판별. 어차피 애초에 명시 안하면 안가져옴
        { $project : { 제목 : 1, _id : 1, score : { $meta : "searchScore" } } }
    ]
        db.collection('post').aggregate(검색조건).toArray((err, result) => {
        console.log(result);
        res.render('search.ejs', { search : result });
    });
});

// 이미지, 영상 업로드 요청
// npm install multer => 파일 전송을 쉽게 저장할 수 있게 도와주는 라이브러리
let multer = require('multer');

// diskStorage 이미지를 어디에 저장할지 정의하는 함수 이미지 서버 하드에 저장
// memoryStorage 이미지를 메모리 램에 저장. 휘발성 있게 저장
var storage = multer.diskStorage({
   destination : function(req, file, callback) {
    callback(null, './public/image'); // public/image 폴더 안에 저장
   },
   filename : function(req, file, callback) {
    callback(null, file.originalname); // 파일명 설정하는 부분인데 originalname 기본파일명으로 저장
   }
//    },
//    filefilter : function(req, file, callback) { // 파일 형식 (확장자) 거르기
//     var ext = path.extname(file.originalname);
//     if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
//         return callback(new Error('PNG, JPG만 업로드하세요'))
//     }
//     callback(null, true)
//    },
//    limits : { // file 사이즈 제한
//     fileSize: 1024 * 1024
//    }
});

// 이제 post 요청시 위에서 세팅해서 담은 변수 upload multer 를 호출 해주면 됨
var upload = multer( { storage : storage } );

app.get('/upload', function(req, res) {
    res.render('upload.ejs');
});

// upload.single('input에 있는 name 속성') 미들웨어처럼 호출해서 사용
// single 은 이미지 하나만 업로드 가능
// upload.array('input name 속성', 최대 받을 갯수) 여러개 업로드 가능
app.post('/upload', upload.single('profile'), function(req, res) {
    res.send('업로드 완료');
});

// /image/music.jpg 라고 하면 music.jpg 를 보여줘야함
app.get('/image/:imageName', function(req, res) {
    res.sendFile( __dirname + '/public/image/' + req.params.imageName);
});

// list.ejs 에서 /chatroom post 요청이 있을 시
const { ObjectId } = require('mongodb');
const path = require('path');
app.post('/chatroom', loginChk, function(req, res) {
    var 저장할거 = {
        title : '무슨무슨채팅방',
        member : [ObjectId(req.body.당한사람id), req.user._id], // 채팅당한사람, 채팅을 시도한사람, ObjectId 형식으로 저장
        date : new Date()
    }
    db.collection('chatroom').insertOne(저장할거).then( (result) => { // insert 성공했을 때 콜백함수 대신 .then 사용 가능 결과는 result 에 담김
        console.log(result);
        res.send('성공');
    });
});

app.get('/chat', loginChk, function(req, res) {
    // req.user._id 현재 로그인 한 user id
    // member 컬렉션은 array 구조인데 array 안에 '하나만' 찾고싶을 때 member : req.user._id 이런 식으로 찾아도 됨
    // 결과값은 콜백함수 기능을 하는 .then result 에 담겨있음. result 값이 data 라는 이름으로 chat.ejs 에 렌더링
    db.collection('chatroom').find( { member : req.user._id } ).toArray().then( (result) => {
        res.render('chat.ejs', { data : result } );
    });
});

app.post('/message', loginChk, function(req, res) {

    var 저장할거 = {
        parent : req.body.parent, // chatjs 에서 ajax 로 값 넘어옴
        content : req.body.content, // chatjs 에서 ajax 로 값 넘어옴
        userid : req.user._id, // 현재 로그인한 userid
        date : new Date(),
    }

    db.collection('message').insertOne(저장할거).then( (result) => {
        console.log('채팅 DB 저장 완료');
        res.send('채팅 DB 저장 완료');
    });
});

// get 요청 시 URL 파라미터 query string 을 사용하여 서버로 데이터 전송 
// 현재는 채팅방 접속시 메세지들 한번 찾아서 보내고 끝임. 새로운 메세지를 보내면 바로 출력이 안됨
// SSE 방식은 서버가 유저에게 일방적 통신 (아래 로직은 이방법을 사용)
// WebSocket 은 서버와 유저간에 양방향 통신 => socket.io 라이브러리 설치. 접속한 모든 사람이 메세지 주고 받을 수 있는 단체 채팅방
app.get('/message/:id', loginChk, function(req, res) {
    
    // Header 를 이런식으로 수정해주세요
    // http 요청시 숨겨져서 전달되는 정보들도 있음(언어, 브라우저 정보, 쿠키, 어디서왔는지 등) 이러한 정보들은 Header 라는 공간 안에 담겨있음
    // /message로 get 요청시 실시간 채널이 오픈됨
    // 일반 get, post 요청은 1회 1응답만 가능하지만 이런식으로 하면 여러번 응답이 가능함
    res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache"
    });
    // res.setHeader('Connection', 'keep-alive');
    // res.setHeader('Content-Type', 'text/event-stream');
    // res.setHeader('Cache-Control', 'no-cache');

    // 지금 누른 채팅방에 속한 채팅 메세지들 모두 가져오기
    // parent : req.params.id 채팅방을 누르면 채팅방 _id 가 여기에 들어옴 /message/:id 이부분 id
    db.collection('message').find( { parent : req.params.id } ).toArray().then((result) => {
        console.log(result);
        // 서버에서 유저한테 실시간으로 메세지를 '보내는' 방법
        // 어떤 이름으로 데이터를 전송하겠다 라는 뜻 => event : 보낼 데이터 이름 \n
        res.write('event : test\n');

        // data : 보낼 데이터 \n\n
        // 서버에서 실시간 전송시 문자열만 전송 가능함
        // result 값이 array {} {} {} 이런 형태이므로 JSON.stringify 문자열로 변환 후 보냄
        res.write('data : ' + JSON.stringify(result) + '\n\n');
    });

    // changeStream 사용법
    const pipeline = [
        { $match : { 'fullDocument.parent' : req.params.id } } // 컬렉션 안에 원하는 document 만 감시하면 싶으면. 즉 내가 채팅한 부모 게시물만 감시
    ];
    const collection = db.collection('message'); // 컬렉션을 정해주고
    const changeStream = collection.watch(pipeline); // watch 함수를 붙여주면 mongodb 가 실시간으로 감시해줌
    changeStream.on('change', (result) => { // db 에 변동 사항이 생기면 ~
        
        console.log('메세지 변동사항 : ' + JSON.stringify([result.fullDocument]));
        // 응답해주세요 ~ 데이터를 보낼 때 데이터가 [{}, {}, {}] 오브젝트 자료였으므로 형식을 갖춰서 보냄
        res.write('event : test\n');
        res.write('data : ' + JSON.stringify([result.fullDocument]) + '\n\n');
    });

});

// 고객이 '/shop' 경로로 요청했을 때 require('./routes/shop') 미들웨어를 적용해주세요 라는 의미
// 라우트를 나누어서 관리하면 유지보수에 용이함
app.use('/shop', require('./routes/shop.js'));
app.use('/board/sub', require('./routes/board.js'));

// ============== 마지막으로 react 연동하는 방법 ==============
// 1. nodejs 검색 후 설치
// 2. server 작업 폴더 생성후 vscode 폴더 오픈
// 3. server.js 만들고 코드 복붙
// const express = require('express');
// const app = express();
// const path = require('path');
// app.listen(8080, function() {
//     console.log('listening on 8080');
// });
// vscode 터미널 열고 아래와 같이 설치
// 1. npm init -y
// 2. npm install express
// ==========================================================