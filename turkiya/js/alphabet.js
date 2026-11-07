import { speakTurkish } from './audio.js';
import { saveQuizResult } from './progress.js';
import { escapeHtml, escapeAttr } from './quizzes.js';

const LETTERS = [
  { upper:'A',lower:'a',name:'a',ipa:'/a/',type:'vowel',sound:'حركة مفتوحة أمامية غير مدوّرة؛ قريب من الألف الواضحة.',example:'at',meaning:'حصان' },
  { upper:'B',lower:'b',name:'be',ipa:'/b/',type:'consonant',sound:'أطبق الشفتين ثم أطلق الصوت مجهوراً.',example:'balık',meaning:'سمك' },
  { upper:'C',lower:'c',name:'ce',ipa:'/dʒ/',type:'consonant',sound:'مثل j في الإنجليزية jam؛ يبدأ بإغلاق خفيف ثم احتكاك.',example:'cam',meaning:'زجاج' },
  { upper:'Ç',lower:'ç',name:'çe',ipa:'/tʃ/',type:'consonant',sound:'مثل ch في الإنجليزية chair؛ مهموس وواضح.',example:'çay',meaning:'شاي' },
  { upper:'D',lower:'d',name:'de',ipa:'/d/',type:'consonant',sound:'يلامس طرف اللسان منطقة اللثة خلف الأسنان العليا ثم يطلق الصوت.',example:'deniz',meaning:'بحر' },
  { upper:'E',lower:'e',name:'e',ipa:'/e/',type:'vowel',sound:'حركة أمامية متوسطة غير مدوّرة، أقرب إلى e قصيرة واضحة.',example:'ev',meaning:'بيت' },
  { upper:'F',lower:'f',name:'fe',ipa:'/f/',type:'consonant',sound:'يمسّ طرف الأسنان العليا الشفة السفلى مع هواء مستمر.',example:'fil',meaning:'فيل' },
  { upper:'G',lower:'g',name:'ge',ipa:'/ɡ/',type:'consonant',sound:'صوت مجهور من مؤخرة اللسان؛ مثل g في go، لا مثل j.',example:'güneş',meaning:'شمس' },
  { upper:'Ğ',lower:'ğ',name:'yumuşak ge',ipa:'لا يقابل صامتاً ثابتاً',type:'special',sound:'لا يُنطق عادةً كحرف g مستقل. قد يطيل الحركة السابقة أو يكوّن انتقالاً ليناً بين الحركات؛ يتأثر موضعه بالكلمة واللهجة.',example:'dağ',meaning:'جبل' },
  { upper:'H',lower:'h',name:'he',ipa:'/h/',type:'consonant',sound:'هواء حنجري خفيف، وليس الخاء العربية.',example:'hava',meaning:'هواء / طقس' },
  { upper:'I',lower:'ı',name:'ı',ipa:'/ɯ/',type:'vowel',sound:'حركة عالية خلفية غير مدوّرة؛ ارفع مؤخرة اللسان مع إبقاء الشفتين مرتاحتين، ولا تضف ياءً.',example:'ışık',meaning:'ضوء' },
  { upper:'İ',lower:'i',name:'i',ipa:'/i/',type:'vowel',sound:'حركة عالية أمامية غير مدوّرة، قريبة من ياء خفيفة؛ هذه هي i المنقوطة.',example:'ip',meaning:'خيط' },
  { upper:'J',lower:'j',name:'je',ipa:'/ʒ/',type:'consonant',sound:'احتكاكي مجهور قريب من صوت s في الكلمة الفرنسية vision؛ يظهر غالباً في ألفاظ مقتبسة.',example:'jilet',meaning:'شفرة حلاقة' },
  { upper:'K',lower:'k',name:'ke',ipa:'/k/',type:'consonant',sound:'إغلاق مؤخرة اللسان؛ تتغير درجة تقدمه قليلاً بحسب الحركة المجاورة.',example:'kitap',meaning:'كتاب' },
  { upper:'L',lower:'l',name:'le',ipa:'/l/',type:'consonant',sound:'يلامس طرف اللسان اللثة؛ قد يكون أمامياً أو خلفياً بحسب الحركات المجاورة.',example:'limon',meaning:'ليمون' },
  { upper:'M',lower:'m',name:'me',ipa:'/m/',type:'consonant',sound:'إغلاق الشفتين مع مرور الصوت من الأنف.',example:'masa',meaning:'طاولة' },
  { upper:'N',lower:'n',name:'ne',ipa:'/n/',type:'consonant',sound:'طرف اللسان عند اللثة مع مرور الصوت من الأنف.',example:'nar',meaning:'رمان' },
  { upper:'O',lower:'o',name:'o',ipa:'/o/',type:'vowel',sound:'حركة خلفية متوسطة مستديرة؛ قرّب الشفتين دون مبالغة.',example:'okul',meaning:'مدرسة' },
  { upper:'Ö',lower:'ö',name:'ö',ipa:'/ø/',type:'vowel',sound:'حرّك اللسان إلى الأمام كما في e، ثم دوّر الشفتين كما في o؛ لا يوجد مقابل مطابق شائع في العربية.',example:'öğrenci',meaning:'طالب' },
  { upper:'P',lower:'p',name:'pe',ipa:'/p/',type:'consonant',sound:'إغلاق الشفتين ثم إطلاق هواء مهموس؛ لا تضف حركة بعدها.',example:'park',meaning:'حديقة عامة' },
  { upper:'R',lower:'r',name:'re',ipa:'/ɾ/',type:'consonant',sound:'طرقة قصيرة لطرف اللسان عند اللثة؛ لا يلزم تكرير الراء كما في بعض اللهجات العربية.',example:'renk',meaning:'لون' },
  { upper:'S',lower:'s',name:'se',ipa:'/s/',type:'consonant',sound:'احتكاك مهموس عند الأسنان؛ مثل s في كلمة سمك.',example:'saat',meaning:'ساعة' },
  { upper:'Ş',lower:'ş',name:'şe',ipa:'/ʃ/',type:'consonant',sound:'مثل sh في الإنجليزية ship؛ ارفع مقدمة اللسان قليلاً إلى الخلف.',example:'şeker',meaning:'سكر' },
  { upper:'T',lower:'t',name:'te',ipa:'/t/',type:'consonant',sound:'إغلاق طرف اللسان قرب اللثة ثم إطلاق الهواء.',example:'telefon',meaning:'هاتف' },
  { upper:'U',lower:'u',name:'u',ipa:'/u/',type:'vowel',sound:'حركة عالية خلفية مستديرة؛ اللسان للخلف والشفتان مدوّرتان.',example:'uçak',meaning:'طائرة' },
  { upper:'Ü',lower:'ü',name:'ü',ipa:'/y/',type:'vowel',sound:'حرّك اللسان إلى الأمام كما في i ثم دوّر الشفتين كما في u؛ ليست u عادية.',example:'üzüm',meaning:'عنب' },
  { upper:'V',lower:'v',name:'ve',ipa:'/v/',type:'consonant',sound:'احتكاكي مجهور، يلامس فيه طرف الأسنان العليا الشفة السفلى.',example:'vatan',meaning:'وطن' },
  { upper:'Y',lower:'y',name:'ye',ipa:'/j/',type:'consonant',sound:'انزلاق قريب من ياء عربية خفيفة قبل الحركة.',example:'yol',meaning:'طريق' },
  { upper:'Z',lower:'z',name:'ze',ipa:'/z/',type:'consonant',sound:'مثل الزاي العربية؛ احتكاكي مجهور.',example:'zeytin',meaning:'زيتون' }
];

const PAIRS = [
  { audio:'sınır', target:'الحدّ / الحدود', options:['sınır','sinir'], correct:0, why:'الحركة غير المنقوطة ı هي /ɯ/؛ sinir تعني العصب أو التوتر.' },
  { audio:'kir', target:'الأوساخ', options:['kır','kir'], correct:1, why:'في kir الحركة i أمامية منقوطة؛ أما kır ففيها ı خلفية غير منقوطة.' },
  { audio:'göl', target:'بحيرة', options:['gül','göl'], correct:1, why:'göl تعني بحيرة وتحتوي على ö؛ أما gül فتعني وردة وتحتوي على ü.' }
];

export async function renderAlphabet(root, { toast = () => {} } = {}) {
  root.innerHTML = '<div class="loading-state"><span class="loading-ring"></span><p>نحمّل درس الحروف والأصوات…</p></div>';
  root.innerHTML = `<div class="view-header"><div><span class="kicker">ابدأ من الصوت قبل حفظ الكلمة</span><h1>الحروف والأصوات التركية</h1><p>تستخدم الأبجدية التركية الحديثة 29 حرفاً لاتينياً. كل حرف له صورة كبيرة وصغيرة؛ النقطة في I/ı وİ/i تغيّر الصوت، فلا تخلط بينهما.</p></div><span class="status-pill">29 حرفاً</span></div>
    <div class="notice"><strong>ملاحظة صوتية:</strong> أزرار النطق تستعمل الصوت التركي الآلي الذي يوفّره الجهاز عند توفره. قد لا يكون صوتاً أصلياً أو متاحاً في كل متصفح.</div>
    <section class="panel panel-padding section-block"><h2>قبل أن تبدأ: الحركات الثماني</h2><p>الحركات الخلفية هي <b dir="ltr">a, ı, o, u</b>، والأمامية <b dir="ltr">e, i, ö, ü</b>. تساعدك هذه المجموعات لاحقاً على فهم تناغم الحركات في اللواحق. وفي التركية، <b dir="ltr">I/ı</b> بلا نقطة صوتها /ɯ/، بينما <b dir="ltr">İ/i</b> المنقوطة صوتها /i/.</p><div class="vowel-strip" dir="ltr"><span>a</span><span>ı</span><span>o</span><span>u</span><i></i><span>e</span><span>i</span><span>ö</span><span>ü</span></div></section>
    <div class="filter-row" id="letter-filters"><button class="filter-chip active" data-letter-type="all">كل الحروف</button><button class="filter-chip" data-letter-type="vowel">الحركات</button><button class="filter-chip" data-letter-type="consonant">الصوامت</button><button class="filter-chip" data-letter-type="special">أصوات تحتاج انتباهاً</button><label class="search-box compact-search"><span data-icon="search"></span><input id="letter-search" type="search" placeholder="ابحث عن حرف أو مثال"></label></div>
    <div class="alphabet-grid" id="alphabet-grid">${LETTERS.map((letter) => `<article class="letter-card" data-letter-card data-type="${letter.type}" data-search="${escapeAttr([letter.upper,letter.lower,letter.name,letter.example,letter.meaning,letter.sound].join(' '))}"><div class="letter-forms"><span>${escapeHtml(letter.upper)}</span><span>${escapeHtml(letter.lower)}</span></div><div class="letter-name" lang="tr" dir="ltr">${escapeHtml(letter.name)} <span>${escapeHtml(letter.ipa)}</span></div><p>${escapeHtml(letter.sound)}</p><div class="letter-example"><b lang="tr" dir="ltr">${escapeHtml(letter.example)}</b><span>${escapeHtml(letter.meaning)}</span></div><div class="word-actions"><button class="quiet-button button-small" type="button" data-speak-letter="${escapeAttr(letter.name)}">استمع لاسم الحرف</button><button class="tiny-icon-button" type="button" data-speak-letter="${escapeAttr(letter.example)}" aria-label="استمع إلى ${escapeAttr(letter.example)}" title="استمع إلى المثال"><span data-icon="volume"></span></button></div></article>`).join('')}</div>
    <section class="section-block panel panel-padding"><div class="section-heading"><div><span class="kicker">تمييز سمعي</span><h2>هل سمعت الحركة الصحيحة؟</h2><p>استمع إلى الكلمة، ثم اخترها بين كلمتين متقاربتين.</p></div></div>${PAIRS.map((item,index) => `<article class="question-card sound-question" data-sound-question="${index}" data-correct="${item.correct}" data-explanation="${escapeAttr(item.why)}"><div class="audio-controls"><button class="secondary-button button-small" type="button" data-play-pair="${index}"><span data-icon="volume"></span> استمع</button><span>اختر الكلمة التي تعني: ${escapeHtml(item.target)}</span></div><div class="option-list">${item.options.map((option,optionIndex) => `<label class="quiz-option"><input type="radio" name="sound-${index}" value="${optionIndex}"><span class="tr" lang="tr" dir="ltr">${escapeHtml(option)}</span></label>`).join('')}</div><div class="quiz-feedback" aria-live="polite"></div></article>`).join('')}</section>
    <section class="section-block panel panel-padding"><div class="section-heading"><div><h2>ثلاث نقاط نطق تستحق التركيز</h2><p>تدرّب ببطء، وراقب موضع اللسان والشفتين بدلاً من تحويل الصوت إلى أقرب حرف عربي.</p></div></div><div class="tips-grid"><article><span class="level-pill">ı / i</span><h3>نقطة تغيّر الحركة</h3><p><b dir="ltr">ı</b> خلفية غير مدوّرة؛ <b dir="ltr">i</b> أمامية. مثالان: <b dir="ltr">sınır</b> «حدّ»، <b dir="ltr">sinir</b> «عصب».</p></article><article><span class="level-pill">ö / ü</span><h3>لسان أمامي وشفتان مستديرتان</h3><p>ابدأ بوضع اللسان كما في i ثم دوّر الشفتين لصنع ü؛ ولـ ö استخدم حركة e مع تدوير الشفتين. يحتاج الصوت إلى تمرين لا إلى كتابة عربية بديلة.</p></article><article><span class="level-pill">ğ</span><h3>ليس g ثانية</h3><p>الـ <b dir="ltr">ğ</b> غالباً لا تضيف وقفة /g/ جديدة؛ قد تطيل الحركة أو تجعل الانتقال بين حركتين أنعم. استمع إلى الكلمة كاملة.</p></article></div><p class="word-example">لا تحتوي الأبجدية التركية القياسية على q أو w أو x؛ قد تظهر هذه الحروف في أسماء أجنبية أو كلمات مقتبسة.</p></section>`;

  root.querySelectorAll('[data-icon]').forEach((element) => { element.innerHTML = window.turkiyaIcon?.(element.dataset.icon) || ''; });
  root.querySelectorAll('[data-speak-letter]').forEach((button) => button.addEventListener('click', () => {
    const response = speakTurkish(button.dataset.speakLetter, { rate: 0.82 });
    toast(response.ok ? 'استمع إلى صوت الجهاز؛ قد لا يتوفر نطق تركي على كل جهاز.' : response.message);
  }));
  let selectedType = 'all';
  const filter = () => {
    const query = root.querySelector('#letter-search').value.trim().toLocaleLowerCase('tr-TR');
    root.querySelectorAll('[data-letter-card]').forEach((card) => {
      const typeMatches = selectedType === 'all' || card.dataset.type === selectedType;
      card.hidden = !typeMatches || (query && !card.dataset.search.toLocaleLowerCase('tr-TR').includes(query));
    });
  };
  root.querySelector('#letter-search').addEventListener('input', filter);
  root.querySelectorAll('[data-letter-type]').forEach((button) => button.addEventListener('click', () => {
    selectedType = button.dataset.letterType;
    root.querySelectorAll('[data-letter-type]').forEach((chip) => chip.classList.toggle('active', chip === button));
    filter();
  }));
  root.querySelectorAll('[data-play-pair]').forEach((button) => button.addEventListener('click', () => {
    const item = PAIRS[Number(button.dataset.playPair)];
    const response = speakTurkish(item.audio, { rate: 0.72 }); if (!response.ok) toast(response.message);
  }));
  root.querySelectorAll('.sound-question input').forEach((input) => input.addEventListener('change', async () => {
    const card = input.closest('.sound-question'); if (card.dataset.answered) return;
    card.dataset.answered = 'true'; card.querySelectorAll('input').forEach((radio) => { radio.disabled = true; });
    const correct = Number(input.value) === Number(card.dataset.correct); const feedback = card.querySelector('.quiz-feedback');
    feedback.textContent = `${correct ? 'صحيح. ' : 'استمع مرة أخرى. '}${card.dataset.explanation}`;
    feedback.className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
    await saveQuizResult({ score: correct ? 1 : 0, total: 1, skill: 'النطق', label: 'تمييز الحركات التركية' });
    window.dispatchEvent(new CustomEvent('turkiya:progress-changed'));
  }));
}
