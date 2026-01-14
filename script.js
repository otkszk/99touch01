// DOM要素の取得
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const questionText = document.getElementById('question-text');
const answerGrid = document.getElementById('answer-grid');
const livesDisplay = document.getElementById('lives-display');
const progressDisplay = document.getElementById('progress-display');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');

// 設定値の取得用
const selectDan = document.getElementById('select-dan');
const selectOrder = document.getElementById('select-order');
const selectDifficulty = document.getElementById('select-difficulty');

// ゲームの状態管理
let allData = [];
let currentQuestions = [];
let currentIndex = 0;
let lives = 3;
let maxLives = 3;
let isGameOver = false;

// 音声ファイルのパス
const AUDIO_CORRECT = 'assets/audio/correct.mp3';
const AUDIO_WRONG = 'assets/audio/wrong.mp3';

// 初期化処理
window.addEventListener('DOMContentLoaded', () => {
    fetchData();
    
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-restart').addEventListener('click', startGame);
    document.getElementById('btn-home').addEventListener('click', showMenu);
});

// JSONデータの読み込み
async function fetchData() {
    try {
        const response = await fetch('data/data.json');
        if (!response.ok) throw new Error('データが見つかりません');
        allData = await response.json();
        console.log("データ読み込み完了:", allData);
    } catch (error) {
        console.error('エラー:', error);
        alert('データの読み込みに失敗しました。');
    }
}

// ゲーム開始処理
function startGame() {
    // 設定の取得
    const targetDan = parseInt(selectDan.value);
    const order = selectOrder.value;
    const difficulty = selectDifficulty.value;

    // 難易度設定
    if (difficulty === 'easy') maxLives = 999;
    else if (difficulty === 'normal') maxLives = 3;
    else if (difficulty === 'hard') maxLives = 1;
    lives = maxLives;
    
    // 問題のフィルタリング（選択した段のみ抽出）
    let filteredData = allData.filter(item => item.dan === targetDan);
    
    if (filteredData.length === 0) {
        alert("この段のデータがまだありません。JSONを確認してください。");
        return;
    }

    // 出題順の並び替え
    if (order === 'asc') {
        // ID順や答えが小さい順（JSONが順序通りならそのまま）
        filteredData.sort((a, b) => a.answer - b.answer);
    } else if (order === 'desc') {
        filteredData.sort((a, b) => b.answer - a.answer);
    } else if (order === 'random') {
        shuffleArray(filteredData);
    }

    currentQuestions = filteredData;
    currentIndex = 0;
    isGameOver = false;

    // 画面切り替え
    showScreen('game');
    updateStatus();
    
    // 答えのパネル（グリッド）を作成
    setupBoard(filteredData);
    
    // 最初の問題表示
    showQuestion();
}

// 画面表示の切り替え
function showScreen(screenName) {
    menuScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');

    if (screenName === 'menu') menuScreen.classList.remove('hidden');
    if (screenName === 'game') gameScreen.classList.remove('hidden');
    if (screenName === 'result') resultScreen.classList.remove('hidden');
}

function showMenu() {
    showScreen('menu');
}

// 配列をシャッフルする関数（フィッシャー–イェーツ）
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// グリッド（答えボタン）の生成
function setupBoard(questions) {
    answerGrid.innerHTML = ''; // クリア

    // グリッド上の答えの配置は常にランダムにする（探す楽しさのため）
    // currentQuestionsのコピーを作ってシャッフル
    const gridItems = [...questions];
    shuffleArray(gridItems);

    gridItems.forEach(item => {
        const btn = document.createElement('button');
        btn.classList.add('answer-btn');
        btn.textContent = item.answer;
        btn.dataset.answer = item.answer; // 正誤判定用データ属性
        
        btn.addEventListener('click', (e) => handleAnswerClick(e, item.answer));
        answerGrid.appendChild(btn);
    });
}

// 問題の表示
function showQuestion() {
    if (currentIndex >= currentQuestions.length) {
        gameClear();
        return;
    }
    const currentQ = currentQuestions[currentIndex];
    questionText.textContent = currentQ.question;
    questionText.classList.remove('pop-anim'); // アニメーションリセット
    void questionText.offsetWidth; // リフロー発生
}

// 回答クリック時の処理
function handleAnswerClick(e, selectedAnswer) {
    if (isGameOver) return;

    const currentQ = currentQuestions[currentIndex];
    const btn = e.target;

    if (selectedAnswer === currentQ.answer) {
        // 正解
        playSound(AUDIO_CORRECT);
        btn.classList.add('correct-anim');
        
        // 少し待ってからボタンを消す
        setTimeout(() => {
            btn.classList.add('invisible'); // 画面から消す（レイアウトは維持）
            currentIndex++;
            updateStatus();
            showQuestion();
        }, 500);

    } else {
        // 不正解
        playSound(AUDIO_WRONG);
        btn.classList.add('wrong-anim');
        lives--;
        updateStatus();

        // アニメーションクラスを削除して再実行できるようにする
        setTimeout(() => {
            btn.classList.remove('wrong-anim');
        }, 500);

        if (lives <= 0) {
            gameOver();
        }
    }
}

// ステータス表示更新
function updateStatus() {
    // ライフ表示
    let hearts = '';
    if (maxLives > 10) {
        hearts = '∞';
    } else {
        for(let i=0; i<lives; i++) hearts += '❤️';
    }
    livesDisplay.textContent = hearts;

    // 残り問題数
    const remaining = currentQuestions.length - currentIndex;
    progressDisplay.textContent = `のこり: ${remaining}もん`;
}

// 音声再生（エラーハンドリング付き）
function playSound(path) {
    const audio = new Audio(path);
    audio.play().catch(e => {
        console.log("音声再生エラー（ファイルがない、またはブラウザ制限）:", e);
    });
}

// ゲームクリア
function gameClear() {
    isGameOver = true;
    showScreen('result');
    resultTitle.textContent = "クリア！";
    resultTitle.style.color = "#2EC4B6";
    resultMessage.textContent = "すごい！全部せいかいです！";
    playSound(AUDIO_CORRECT); // 最後にファンファーレ的な音があればそれを再生
}

// ゲームオーバー
function gameOver() {
    isGameOver = true;
    showScreen('result');
    resultTitle.textContent = "ざんねん...";
    resultTitle.style.color = "#E71D36";
    resultMessage.textContent = "ライフがなくなりました。";
}