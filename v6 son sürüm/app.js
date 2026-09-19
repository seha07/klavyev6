const TEST_TEXT = `merhaba hesabınız ile ilgili yaşadığınız sorunu anlayabilmek için bilgilerinizi dikkatli şekilde kontrol ediyorum talebinizi aldım gerekli incelemeyi başlatıyorum işlem durumunu sistem üzerinden takip ederek size açık ve anlaşılır bilgi vereceğim güvenliğiniz için kişisel bilgilerinizi sohbet alanında paylaşmayınız doğrulama adımlarını tamamladıktan sonra hesabınızla ilgili işlemleri kontrol edebiliriz bekleme sürecinde göstereceğiniz anlayış için teşekkür ederim yaşadığınız teknik sorun uygulama tarayıcı bağlantı ekran veya oturum kaynaklı olabilir gerekli kontrolleri tamamlamak için işleminizi sırayla inceliyorum sayfayı yeniledikten sonra aynı sorun devam ederse farklı bir tarayıcı kullanabilirsiniz bağlantınızın kararlı olduğundan emin olduktan sonra işlemi yeniden deneyebilirsiniz talebiniz ilgili ekibe aktarılacak ve güncel durum size bildirilecektir hesabınızdaki bakiye işlem geçmişi ödeme bilgisi başvuru sonucu onay durumu kayıt bilgisi ve destek talebi dikkatli şekilde incelenmektedir işlem tamamlandığında sonucu gecikmeden sizinle paylaşacağız verdiğiniz bilgilerin doğru olması kontrol sürecinin daha hızlı ilerlemesine yardımcı olur herhangi bir hata görmeniz halinde ekran görüntüsü yerine mümkünse hatanın metnini paylaşmanız yeterlidir sistem üzerinde yapılan kontroller sırasında bazı işlemler kısa süreli bekleme gösterebilir bu durumda yeniden işlem oluşturmadan önce mevcut kaydın sonucunu beklemek gerekir destek ekibi olarak sorularınızı yanıtlamak ve işlemleriniz hakkında bilgi vermek için buradayız size yardımcı olabilmek adına talebinizi doğru şekilde anlamaya ve gerekli yönlendirmeyi yapmaya özen gösteriyoruz işlem sırasında sayfadan ayrılmamanız ve verilen adımları sırasıyla uygulamanız önemlidir bağlantı kesintisi yaşanırsa oturumunuzu tekrar açarak kaldığınız yerden devam edebilirsiniz güncelleme sonrasında uygulamanın yeniden başlatılması gerekebilir tarayıcı önbelleğini temizlemek bazı görüntüleme sorunlarının giderilmesine yardımcı olabilir hesabınıza erişim ile ilgili bir problem yaşarsanız giriş bilgilerinizi tekrar kontrol ederek işlemi yenileyebilirsiniz bekleyen işlemlerde süre yoğunluğa göre değişebilir sonuçlandığında sistem üzerinde güncel bilgi görüntülenir müşteri memnuniyeti bizim için önemlidir tüm talepleriniz kayıt altına alınarak mümkün olan en doğru şekilde değerlendirilir sorunuz farklı bir konu ile ilgiliyse yeni talebinizi açıklayabilir ve gerekli desteği alabilirsiniz verdiğiniz bilgiler doğrultusunda size uygun çözümü sunmak için kontrolleri sürdürüyoruz işleminizin detaylarını inceledikten sonra sonucu paylaşacağım anlayışınız ve sabrınız için teşekkür ederim`;

const durationButtons = [...document.querySelectorAll(".duration")];
const newTestBtn = document.getElementById("newTest");
const againBtn = document.getElementById("again");
const textDisplay = document.getElementById("textDisplay");
const typingInput = document.getElementById("typingInput");
const timeEl = document.getElementById("time");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const errorsEl = document.getElementById("errors");
const progressBar = document.getElementById("progressBar");
const stateEl = document.getElementById("state");
const resultEl = document.getElementById("result");
const finalWpmEl = document.getElementById("finalWpm");
const finalAccuracyEl = document.getElementById("finalAccuracy");
const finalCharsEl = document.getElementById("finalChars");
const finalCorrectEl = document.getElementById("finalCorrect");
const finalErrorsEl = document.getElementById("finalErrors");
const bestWpmEl = document.getElementById("bestWpm");
const keyboardEl = document.getElementById("keyboard");

const KEYBOARD_ROWS = [
  ["Esc","1","2","3","4","5","6","7","8","9","0","-","=","Backspace"],
  ["Tab","Q","W","E","R","T","Y","U","I","O","P","Ğ","Ü"],
  ["Caps","A","S","D","F","G","H","J","K","L","Ş","İ"],
  ["Shift","Z","X","C","V","B","N","M","Ö","Ç","Shift"],
  ["Ctrl","Alt","Space","Alt Gr","Ctrl"]
];

let duration = 60;
let startTime = null;
let timer = null;
let finished = false;

let words = [];
let currentWordIndex = 0;
let committedInput = "";
let sessionCorrect = 0;
let sessionErrors = 0;
let sessionTyped = 0;
let keyUsage = {};

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function sanitizeText(text) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-zçğıöşü\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildWords() {
  // The source contains Turkish characters and no punctuation in the displayed test.
  const source = sanitizeText(TEST_TEXT);
  return source.split(" ").filter(Boolean);
}

function lineCapacity() {
  const width = textDisplay.clientWidth || 980;
  const avgCharWidth = window.innerWidth < 480 ? 8.0 : 9.3;
  return Math.max(34, Math.floor((width - 35) / avgCharWidth));
}

function getVisibleLines() {
  const lines = [];
  const maxChars = lineCapacity();
  let line = [];
  let chars = 0;

  for (let i = currentWordIndex; i < words.length; i++) {
    const word = words[i];
    const extra = line.length ? word.length + 1 : word.length;

    if (line.length && chars + extra > maxChars) {
      lines.push(line);
      if (lines.length === 3) break;
      line = [];
      chars = 0;
    }

    line.push(i);
    chars += line.length === 1 ? word.length : word.length + 1;
  }

  if (line.length && lines.length < 3) lines.push(line);
  return lines;
}

function getLineGroups() {
  const maxChars = lineCapacity();
  const groups = [];
  let line = [];
  let chars = 0;

  // Build lines from the current position forward.
  // A line is retained in the viewport until the typing cursor moves
  // into the next line. This keeps completed words visible.
  for (let i = currentWordIndex; i < words.length; i++) {
    const word = words[i];
    const extra = line.length ? word.length + 1 : word.length;

    if (line.length && chars + extra > maxChars) {
      groups.push(line);
      line = [];
      chars = 0;
      if (groups.length === 3) break;
    }

    line.push(i);
    chars += line.length === 1 ? word.length : word.length + 1;
  }

  if (line.length && groups.length < 3) groups.push(line);
  return groups;
}

function getPreviousLineIfNeeded() {
  // When currentWordIndex is inside a line, the line containing the cursor
  // should be the first visible line. We derive the current line by rebuilding
  // from the test start until the cursor.
  const maxChars = lineCapacity();
  let line = [];
  let chars = 0;

  for (let i = 0; i <= currentWordIndex; i++) {
    const word = words[i] || "";
    const extra = line.length ? word.length + 1 : word.length;

    if (line.length && chars + extra > maxChars) {
      // currentWordIndex starts a new line: return that line's start position.
      return i;
    }

    line.push(i);
    chars += line.length === 1 ? word.length : word.length + 1;
  }

  return 0;
}

function updateTextDisplay() {
  const lineStartIndex = getPreviousLineIfNeeded();
  const maxChars = lineCapacity();
  const lines = [];
  let line = [];
  let chars = 0;

  // Render from the current line forward.
  for (let i = lineStartIndex; i < words.length; i++) {
    const word = words[i];
    const extra = line.length ? word.length + 1 : word.length;

    if (line.length && chars + extra > maxChars) {
      lines.push(line);
      if (lines.length === 3) break;
      line = [];
      chars = 0;
    }

    line.push(i);
    chars += line.length === 1 ? word.length : word.length + 1;
  }

  if (line.length && lines.length < 3) lines.push(line);

  textDisplay.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "text-lines";

  lines.forEach((lineIndexes, linePosition) => {
    const lineEl = document.createElement("div");
    lineEl.className = "text-line";

    lineIndexes.forEach((wordIndex) => {
      const wordEl = document.createElement("span");
      wordEl.className = "word";

      if (wordIndex === currentWordIndex) wordEl.classList.add("current");
      if (wordIndex < currentWordIndex) wordEl.classList.add("done");

      const target = words[wordIndex];

      for (let i = 0; i < target.length; i++) {
        const ch = document.createElement("span");
        ch.className = "char";
        ch.textContent = target[i];

        if (wordIndex === currentWordIndex) {
          if (i < committedInput.length) {
            ch.classList.add(committedInput[i] === target[i] ? "correct" : "incorrect");
          } else if (i === committedInput.length) {
            ch.classList.add("current");
          }
        } else if (wordIndex < currentWordIndex) {
          // Keep completed words visible.
          ch.classList.add("done");
        }

        wordEl.appendChild(ch);
      }

      // Preserve the visual space between words without requiring
      // a separate keyboard action in the renderer.
      lineEl.appendChild(wordEl);
    });

    wrap.appendChild(lineEl);
  });

  textDisplay.appendChild(wrap);

  // Progress tracks completed words.
  const progress = words.length ? (currentWordIndex / words.length) * 100 : 0;
  progressBar.style.width = `${Math.min(100, progress)}%`;
}

function currentMetrics() {
  const total = sessionTyped;
  const correct = sessionCorrect;
  const errors = sessionErrors;
  const elapsedMinutes = Math.max(
    ((startTime ? Date.now() : Date.now()) - (startTime || Date.now())) / 60000,
    1 / 60000
  );
  const wpm = (correct / 5) / elapsedMinutes;
  const accuracy = total ? (correct / total) * 100 : 100;

  return { total, correct, errors, wpm, accuracy };
}

function updateStats() {
  const m = currentMetrics();
  wpmEl.textContent = Math.round(m.wpm);
  accuracyEl.textContent = `${m.accuracy.toFixed(0)}%`;
  errorsEl.textContent = m.errors;
}

function startTimer() {
  if (startTime || finished) return;
  startTime = Date.now();
  stateEl.textContent = "Test devam ediyor";

  timer = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const left = duration - elapsed;
    timeEl.textContent = formatTime(left);
    updateStats();
    if (left <= 0) finishTest();
  }, 80);
}

function renderKeyboard() {
  keyboardEl.innerHTML = "";
  KEYBOARD_ROWS.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "key-row";
    row.forEach(key => {
      const keyEl = document.createElement("div");
      keyEl.className = "key";
      keyEl.dataset.key = key;
      keyEl.textContent = key;
      if (["Backspace","Tab","Caps","Shift"].includes(key)) keyEl.classList.add("wide");
      if (key === "Space") keyEl.classList.add("space");
      rowEl.appendChild(keyEl);
    });
    keyboardEl.appendChild(rowEl);
  });
  updateKeyboard();
}

function updateKeyboard() {
  const max = Math.max(1, ...Object.values(keyUsage));
  keyboardEl.querySelectorAll(".key").forEach(keyEl => {
    keyEl.classList.remove("level-1","level-2","level-3","level-4","active");
    const key = keyEl.dataset.key.toUpperCase();
    const value = keyUsage[key] || 0;
    if (!value) return;

    const ratio = value / max;
    if (ratio <= 0.25) keyEl.classList.add("level-1");
    else if (ratio <= 0.5) keyEl.classList.add("level-2");
    else if (ratio <= 0.75) keyEl.classList.add("level-3");
    else keyEl.classList.add("level-4");
  });
}

function trackTypedCharacter(ch) {
  const normalized = ch.toLocaleUpperCase("tr-TR");
  if (/^[A-ZÇĞİÖŞÜ]$/.test(normalized)) {
    keyUsage[normalized] = (keyUsage[normalized] || 0) + 1;
    updateKeyboard();
  }
}

function saveBest(wpm) {
  const oldBest = Number(localStorage.getItem("betpufTypingBest") || 0);
  const best = Math.max(oldBest, Math.round(wpm));
  localStorage.setItem("betpufTypingBest", String(best));
  bestWpmEl.textContent = best;
}

function commitCurrentWord() {
  const target = words[currentWordIndex];
  const typed = committedInput;

  if (!typed) return;

  // Space is the only action that commits a word.
  // The word is counted as correct/incorrect as entered; it does not block progression.
  for (let i = 0; i < Math.max(target.length, typed.length); i++) {
    sessionTyped++;
    if (i < target.length && i < typed.length && target[i] === typed[i]) {
      sessionCorrect++;
    } else {
      sessionErrors++;
    }
  }

  currentWordIndex++;
  committedInput = "";
  typingInput.value = "";

  if (currentWordIndex >= words.length) {
    finishTest();
    return;
  }

  // The completed word stays visible. The viewport only drops a line
  // when the cursor has moved onto a new line.
  updateTextDisplay();
  updateStats();
  typingInput.focus();
}

function handleInput() {
  if (finished) return;
  let value = typingInput.value.toLocaleLowerCase("tr-TR");

  // Input area is for one current word only. A space commits the word.
  if (value.includes(" ")) {
    const pieces = value.split(" ");
    const typedBeforeSpace = pieces[0];
    committedInput = typedBeforeSpace.replace(/[^a-zçğıöşü]/gi, "");

    // Count the actual typed characters for keyboard heat-map purposes.
    for (const ch of committedInput) trackTypedCharacter(ch);

    sessionTyped += 0; // committed in commitCurrentWord
    typingInput.value = committedInput;

    commitCurrentWord();
    return;
  }

  const cleaned = value.replace(/[^a-zçğıöşü]/gi, "");
  if (cleaned !== value) typingInput.value = cleaned;

  const previous = committedInput;
  committedInput = typingInput.value;
  if (committedInput.length > previous.length) {
    for (const ch of committedInput.slice(previous.length)) trackTypedCharacter(ch);
  }

  if (!startTime && committedInput.length > 0) startTimer();

  updateTextDisplay();
  updateStats();
}

typingInput.addEventListener("input", handleInput);

typingInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === "Tab") {
    event.preventDefault();
    return;
  }

  if (event.key === " ") {
    event.preventDefault();
    if (committedInput.trim()) {
      commitCurrentWord();
    }
  }

  if (event.key.length === 1 && event.key !== " " && !/[a-zçğıöşü]/i.test(event.key)) {
    event.preventDefault();
  }
});

durationButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (!startTime) setDuration(button.dataset.duration);
  });
});

function setDuration(value) {
  duration = Number(value);
  durationButtons.forEach(btn => btn.classList.toggle("active", Number(btn.dataset.duration) === duration));
  if (!startTime) timeEl.textContent = formatTime(duration);
}

function finishTest() {
  if (finished) return;
  finished = true;
  clearInterval(timer);
  timer = null;

  const m = currentMetrics();
  timeEl.textContent = "00:00";
  stateEl.textContent = "Test tamamlandı";
  typingInput.blur();

  finalWpmEl.textContent = Math.round(m.wpm);
  finalAccuracyEl.textContent = `${m.accuracy.toFixed(1)}%`;
  finalCharsEl.textContent = m.total;
  finalCorrectEl.textContent = m.correct;
  finalErrorsEl.textContent = m.errors;

  saveBest(m.wpm);
  resultEl.classList.remove("hidden");
}

function resetTest() {
  clearInterval(timer);
  timer = null;
  startTime = null;
  finished = false;

  words = buildWords();
  currentWordIndex = 0;
  committedInput = "";
  sessionCorrect = 0;
  sessionErrors = 0;
  sessionTyped = 0;
  keyUsage = {};

  typingInput.value = "";
  resultEl.classList.add("hidden");
  timeEl.textContent = formatTime(duration);
  stateEl.textContent = "Başlamak için yazmaya başlayın";

  renderKeyboard();
  updateTextDisplay();
  updateStats();
  typingInput.focus();
}

newTestBtn.addEventListener("click", resetTest);
againBtn.addEventListener("click", resetTest);
textDisplay.addEventListener("click", () => typingInput.focus());

window.addEventListener("resize", updateTextDisplay);

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.length === 1 && document.activeElement !== typingInput) {
    typingInput.focus();
  }
});

bestWpmEl.textContent = Number(localStorage.getItem("betpufTypingBest") || 0);
resetTest();
