// ページの読み込みが完了してから実行
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 変数と要素の準備 ---
    let scoreAka = 0; // 赤の現在の得点
    let scoreAo = 0;  // 青の現在の得点
    const MAX_SCORE = 6; // 最大得点
    let isAnimating = false; // アニメーション中かどうかの目印

    // HTMLの要素を取得
    const cutInOverlay = document.getElementById('cut-in-overlay');
    const cutInText = document.getElementById('cut-in-text');
    const cutInPoints = document.getElementById('cut-in-points');
    const cutInEnglish = document.getElementById('cut-in-english');
    const cutInPointsEnglish = document.getElementById('cut-in-points-english');


    // チームの丸（サークル）要素を先に取得
    const circlesAka = document.querySelectorAll('.aka .circle');
    const circlesAo = document.querySelectorAll('.ao .circle');

    // タイマー関連
    const timerElement = document.getElementById('timer'); // タイマー表示要素
    let timerSeconds = 60; // 制限時間（秒）
    let timerInterval = null; // タイマーのIDを管理
    let isTimerRunning = false; // タイマーが動いているか


    // --- 2. キー入力の受付 ---
    document.addEventListener('keydown', (event) => {
        
        // まずキーを取得します
        const key = event.key.toLowerCase();

        // ★★★ 1. 取り消し操作 (QとPキー) を【最優先】でチェック！ ★★★
        // これを isAnimating のチェックより前に置くことで、
        // 試合終了状態（アニメーション中扱い）でも取り消しが可能になります。
        if (key === 'q') {
            undoScore('aka');
            return; 
        } else if (key === 'p') {
            undoScore('ao');
            return; 
        }

        // ★★★ 2. アニメーション中のチェック ★★★
        // Q/Pキー以外は、アニメーション中なら無視します
        if (isAnimating) {
            console.log("アニメーション中です。");
            return;
        }

        // スペースキーでタイマースタート
        if (key === ' ' || key === 'spacebar') {
            if (!isTimerRunning) {
                startTimer(); // タイマー停止中 → 開始
                console.log("タイマースタート！");
            } else {
                stopTimer(); // タイマー動作中 → 停止
                console.log("タイマーストップ！");
            }
            // タイマー操作のキーはここで処理を終了
            return; 
        }
        
        // 3. 試合が既に終了している場合は、得点キー入力を無視
        if (scoreAka >= MAX_SCORE || scoreAo >= MAX_SCORE) {
            console.log("試合は終了しました。");
            return;
        }
        
        // 4. タイマーが動いていない（試合開始前）なら、得点キーも無視
        if (!isTimerRunning) {
            console.log("スペースキーでタイマーを開始してください。");
            return;
        } 
        
        
        switch (key) {
            case 'a':
                addScore('aka', 1, '有効');
                break;
            case 's':
                addScore('aka', 2, '技あり');
                break;
            case 'd':
                addScore('aka', 3, '一本');
                break;
            case 'l': 
                addScore('ao', 1, '有効');
                break;
            case 'k': 
                addScore('ao', 2, '技あり');
                break;
            case 'j': 
                addScore('ao', 3, '一本');
                break;
        }
    });

    // 日本語と英語の対応表
    const englishMap = {
        '有効': 'YUKO',
        '技あり': 'WAZA-ARI',
        '一本': 'IPPON',
        '勝者': 'WINNER',
        '引き分け': 'DRAW',
    };
    const universityMap = {
        '立命館大学': 'RITSUMEIKAN UNIV.', 
        '京都大学': 'KYOTO UNIV.'
    };

    // --- 3. 得点処理とカットイン表示 ---
    function addScore(team, points, text) {
        // アニメーション開始の目印を立てる
        isAnimating = true;

        // 1. カットインの表示内容を設定
        cutInText.textContent = text;
        cutInPoints.textContent = `${points} ポイント`;
        cutInEnglish.textContent = englishMap[text] || text;
        cutInPointsEnglish.textContent = `${points} POINTS`;

        // 2. チームカラーの背景を設定
        cutInOverlay.classList.remove('aka-bg', 'ao-bg'); // 念のためリセット
        if (team === 'aka') {
            cutInOverlay.classList.add('aka-bg');
        } else {
            cutInOverlay.classList.add('ao-bg');
        }

        // 3. カットインを表示（.showクラスを付ける）
        cutInOverlay.classList.add('show');

        // 4. 一定時間（1.5秒）後に処理
        setTimeout(() => {
            // 5. カットインを非表示に
            cutInOverlay.classList.remove('show');

            // 6. 実際のスコアを加算
            if (team === 'aka') {
                scoreAka += points;
                scoreAka = Math.min(scoreAka, MAX_SCORE); // 6点を超えないように
                updateScoreCircles(circlesAka, scoreAka); // 丸を更新

            } else { // team === 'ao'
                scoreAo += points;
                scoreAo = Math.min(scoreAo, MAX_SCORE); // 6点を超えないように
                const reversedCirclesAo = Array.from(circlesAo).reverse();
                updateScoreCircles(reversedCirclesAo, scoreAo);
            }

            // 7. アニメーション終了
            isAnimating = false;

            // 8. 勝利判定
            checkWinner();

        }, 1500); // 1.5秒（1500ミリ秒）表示
    }

    // --- 4. 得点取り消し関数 (undoScore) ---
    function undoScore(team) {
        // 時間切れ（0秒）の場合は、取り消し操作を受け付けない
        if (timerSeconds <= 0) {
            console.log("時間切れのため、取り消しできません。");
            return;
        }

        if (team === 'aka' && scoreAka > 0) {
            scoreAka -= 1;
            updateScoreCircles(circlesAka, scoreAka);
            console.log(`[UNDO] 赤チームの得点を1点取り消しました。現在の点数: ${scoreAka}`);
        } else if (team === 'ao' && scoreAo > 0) {
            scoreAo -= 1;
            // 青チームは右から丸を更新するため、逆順リストを使用
            const reversedCirclesAo = Array.from(circlesAo).reverse();
            updateScoreCircles(reversedCirclesAo, scoreAo);
            console.log(`[UNDO] 青チームの得点を1点取り消しました。現在の点数: ${scoreAo}`);
        } else {
            console.log(`${team === 'aka' ? '赤' : '青'}チームの得点は0点のため、取り消しできません。`);
            return; // 0点ならここで終了
        }
        
        // ★★★ 勝利状態が解除された場合の処理 ★★★
        
        // 勝利カットインが画面に出ており、かつ得点取り消しでMAX_SCORE未満に戻り、
    // かつ試合時間が残っている（時間切れではない）場合
    if (cutInOverlay.classList.contains('show') && (scoreAka < MAX_SCORE && scoreAo < MAX_SCORE) && timerSeconds > 0) {
         
         // 1. カットインを非表示に戻す
         cutInOverlay.classList.remove('show');
         
         // 2. isAnimating を false に戻すことで、キー入力を復活させる！
         isAnimating = false; // ★これが決定的な修正です★

         // 3. タイマーを再開する (勝利で停止していた場合)
         if (!isTimerRunning) {
             startTimer();
             console.log("勝利状態が解除されたため、タイマーを再開しました。");
         }
    } else {
         // ★追加: 試合終了後の Undo 操作の場合、isAnimatingを false に戻す (Timer操作を可能にする)
         // MAX_SCORE以下に戻ったが、まだTimerが動いていない可能性や、
         // カットインが表示されていない状態でUndoキーが押された場合をカバー
         isAnimating = false; 
    }
}

    // --- 5. 得点の丸を塗りつぶす関数 ---
    function updateScoreCircles(circles, totalScore) {
        // circlesは .circle のリスト
        circles.forEach((circle, index) => {
            // indexは 0 から 5
            if (index < totalScore) {
                // 合計得点未満のインデックスの丸を塗りつぶす
                circle.classList.add('filled');
            } else {
                // (リセット用) 塗りつぶしを解除
                circle.classList.remove('filled');
            }
        });
    }

    
    // --- 6. タイマースタート関数 ---
    function startTimer() {
        console.log("タイマースタート！");
        isTimerRunning = true;
        
        // 1秒ごと (1000ミリ秒) に updateTimer を実行
        timerInterval = setInterval(updateTimer, 1000);
    }

    // --- 7. タイマー更新関数（1秒ごとに呼ばれる） ---
    function updateTimer() {
        timerSeconds--; // 1秒減らす
        
        // 表示を更新 (例: 60 -> "01:00", 9 -> "00:09")
        const minutes = Math.floor(timerSeconds / 60);
        const seconds = timerSeconds % 60;
        timerElement.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // 0秒になったら
        if (timerSeconds <= 0) {
            stopTimer();
            checkWinner(); // 時間切れでも勝利判定（引き分け処理）
        }
    }

    // --- 8. タイマーストップ関数 ---
    function stopTimer() {
        clearInterval(timerInterval); // setIntervalを停止
        isTimerRunning = false;
        console.log("タイマーストップ");
    }


    // --- 9. 勝利判定 (checkWinner) ---
    function checkWinner() {
        let winnerText = null;
        let messageText = '試合終了';
        let messageEnglish = 'END OF THE MATCH';
        let teamClass = '';
        let isTimeUp = false;

        // 1. 6点先取による勝利
        if (scoreAka >= MAX_SCORE) {
            winnerText = '勝者  立命館大学';
            teamClass = 'aka-bg';
            stopTimer();
        } else if (scoreAo >= MAX_SCORE) {
            winnerText = '勝者  京都大学';
            teamClass = 'ao-bg';
            stopTimer();
        
        } 
        // 2. 時間切れによる勝敗決定
        else if (timerSeconds <= 0) {
            isTimeUp = true;
            messageText = '試合終了';
            messageEnglish = 'TIME UP';

            if (scoreAka > scoreAo) {
                winnerText = '勝者  立命館大学';
                teamClass = 'aka-bg';
            } else if (scoreAo > scoreAka) {
                winnerText = '勝者  京都大学';
                teamClass = 'ao-bg';
            } else {
                winnerText = '引き分け';
                teamClass = 'midori-bg';
            }
        }

        // 3. 勝利が決定した場合の表示処理
        if (winnerText) {
        console.log(winnerText);
        isAnimating = true; 

        // ----- 勝利メッセージの英語表記を作成 -----
        let winnerFullEnglish;

        if (winnerText === '引き分け') {
            // 引き分けの場合: 英語メッセージは "Draw" のみ
            winnerFullEnglish = englishMap['引き分け'];
        } else {
            const parts = winnerText.split('  ');
            const winnerMessageJp = parts[0]; 
            const universityNameJp = parts[1]; 
            
            const winnerMessageEn = englishMap[winnerMessageJp]; // 'WINNER'
            const universityNameEn = universityMap[universityNameJp] || universityNameJp; 

            winnerFullEnglish = `${winnerMessageEn} ${universityNameEn}`;
        }
        
        // カットイン表示
        cutInOverlay.classList.remove('aka-bg', 'ao-bg', 'midori-bg');
        cutInOverlay.classList.add(teamClass);
        
        // 勝利表示時はメッセージと勝者を入れ替える
        cutInText.textContent = messageText;
        cutInEnglish.textContent = messageEnglish;     
        
        cutInPoints.textContent = winnerText;          
        cutInPointsEnglish.textContent = winnerFullEnglish; // 大学名を含む英語をセット
        
        cutInOverlay.classList.add('show');
    }
        
    }


    
});