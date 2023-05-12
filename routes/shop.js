
// npm 에서 설치했던 express 라이브러리의 Router() 라는 함수를 사용하겠다 선언
// nodejs 는 파일이나 라이브러리를 가져다 사용하고 싶을 때는 require
var router = require('express').Router();

// 미들웨어 함수 만들기
// 로그인 후 세션이 있으면 요청.user 는 항상 있음
function loginChk (req, res, next) {
    // 요청.user 가 있는지 여부 체크
    if (req.user) { 
        next(); // 통과
    } else {
        res.send('로그인 후 이용해주세요.');
    }
}

// 이 페이지에 있는 모든 라우터 URL 에 적용할 미들웨어를 만들면 편함
// 하지만 특정 라우터 URL 에만 미들웨어를 적용하고 싶을 때
// router.use('/shirts', loginChk); 
router.use(loginChk);

// app.get 하듯 router.get 으로 사용
// 특정 파일에 미들웨어를 적용하고 싶으면 개별 라우트 URL 에 적용
router.get('/shirts', function(req, res) {
    res.send('셔츠 판매 페이지입니다.');
});

router.get('/pants', function(req, res) {
    res.send('바지 판매 페이지입니다.');
});

module.exports = router; // router => 내보낼 변수명 즉, require('express').Router();