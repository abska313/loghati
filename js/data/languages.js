const PERSIAN = {
  code: 'fa',
  name: 'الفارسية',
  nativeName: 'فارسی',
  flag: '🇮🇷',
  dir: 'rtl',
  script: 'arabic',
  speakers: '~110 مليون',
  ttsLang: 'fa-IR',
  levels: {
    A0: {
      title: 'البداية',
      units: [{
        id: 'fa-a0-u1',
        title: 'التحيات',
        lessons: [
          {
            id: 'fa-a0-u1-l1',
            title: 'التحية الأساسية',
            objective: 'أن تُحيّي وتُرحّب وتودّع بالفارسية',
            vocab: [
              { id: 'fa-salam', word: 'سلام', roman: 'salâm', meaning: 'مرحبا', type: 'تحية',
                example: 'سلام، خوبی؟', exampleMeaning: 'مرحبًا، كيف حالك؟' },
              { id: 'fa-khobi', word: 'خوبی؟', roman: 'khubi?', meaning: 'كيف حالك؟', type: 'سؤال',
                example: 'سلام، خوبی؟', exampleMeaning: 'مرحبًا، كيف حالك؟' },
              { id: 'fa-mamnun', word: 'ممنون', roman: 'mamnun', meaning: 'شكرًا', type: 'تعبير',
                example: 'ممنون، خوبم.', exampleMeaning: 'شكرًا، أنا بخير.' },
              { id: 'fa-bale', word: 'بله', roman: 'bale', meaning: 'نعم', type: 'أداة',
                example: 'بله، ممنون.', exampleMeaning: 'نعم، شكرًا.' },
              { id: 'fa-na', word: 'نه', roman: 'na', meaning: 'لا', type: 'أداة',
                example: 'نه، ممنون.', exampleMeaning: 'لا، شكرًا.' },
              { id: 'fa-khodahafez', word: 'خداحافظ', roman: 'khodâhâfez', meaning: 'إلى اللقاء', type: 'تعبير',
                example: 'خداحافظ، تا فردا.', exampleMeaning: 'إلى اللقاء، أراك غدًا.' }
            ],
            grammar: {
              concept: 'ضمائر المتكلم والمخاطب',
              explanation: 'في الفارسية، الضمائر منفصلة عن الفعل، والفعل يتغير حسب الضمير.',
              pattern: 'من (أنا) — تو (أنت) — او (هو/هي)',
              examples: [
                { t: 'من خوبم', r: 'man khubam', m: 'أنا بخير' },
                { t: 'تو چطوری؟', r: 'to chetori?', m: 'كيف حالك؟ (غير رسمي)' },
                { t: 'او خوب است', r: 'u khub ast', m: 'هو/هي بخير' }
              ]
            }
          },
          {
            id: 'fa-a0-u1-l2',
            title: 'التقديم بنفسك',
            objective: 'أن تُعرّف بنفسك وتسأل عن الاسم',
            vocab: [
              { id: 'fa-esm', word: 'اسم', roman: 'esm', meaning: 'اسم', type: 'اسم',
                example: 'اسم من علی است.', exampleMeaning: 'اسمي علي.' },
              { id: 'fa-man', word: 'من', roman: 'man', meaning: 'أنا', type: 'ضمير',
                example: 'من دانشجو هستم.', exampleMeaning: 'أنا طالب.' },
              { id: 'fa-shoma', word: 'شما', roman: 'shomâ', meaning: 'أنتم/أنت (رسمي)', type: 'ضمير',
                example: 'شما اهل کجا هستید؟', exampleMeaning: 'من أين أنتم؟' },
              { id: 'fa-iran', word: 'ایران', roman: 'irân', meaning: 'إيران', type: 'اسم مكان',
                example: 'من اهل ایران هستم.', exampleMeaning: 'أنا من إيران.' }
            ],
            grammar: {
              concept: 'جملة التعريف بالاسم',
              explanation: 'نستخدم "اسم من ... است" للتعريف بالاسم.',
              pattern: 'اسم من + [الاسم] + است',
              examples: [
                { t: 'اسم من مریم است.', r: 'esm-e man maryam ast.', m: 'اسمي مريم.' },
                { t: 'من اهل مصر هستم.', r: 'man ahl-e mesr hastam.', m: 'أنا من مصر.' }
              ]
            }
          }
        ]
      }]
    },
    A1: {
      title: 'الأساسيات',
      units: [{
        id: 'fa-a1-u1',
        title: 'الحياة اليومية',
        lessons: [{
          id: 'fa-a1-u1-l1',
          title: 'الأرقام والأيام',
          objective: 'أن تعدّ من 1 إلى 10 وتذكر أيام الأسبوع',
          vocab: [
            { id: 'fa-yek', word: 'یک', roman: 'yek', meaning: 'واحد', type: 'عدد', example: 'یک کتاب', exampleMeaning: 'كتاب واحد' },
            { id: 'fa-do', word: 'دو', roman: 'do', meaning: 'اثنان', type: 'عدد', example: 'دو نفر', exampleMeaning: 'شخصان' },
            { id: 'fa-se', word: 'سه', roman: 'se', meaning: 'ثلاثة', type: 'عدد', example: 'سه روز', exampleMeaning: 'ثلاثة أيام' },
            { id: 'fa-chahar', word: 'چهار', roman: 'chahâr', meaning: 'أربعة', type: 'عدد', example: 'چهار فصل', exampleMeaning: 'أربعة فصول' },
            { id: 'fa-panj', word: 'پنج', roman: 'panj', meaning: 'خمسة', type: 'عدد', example: 'پنج دقیقه', exampleMeaning: 'خمس دقائق' },
            { id: 'fa-shanbe', word: 'شنبه', roman: 'shanbe', meaning: 'السبت', type: 'يوم', example: 'شنبه تعطیل است.', exampleMeaning: 'السبت عطلة.' },
            { id: 'fa-yekshanbe', word: 'یکشنبه', roman: 'yekshanbe', meaning: 'الأحد', type: 'يوم', example: 'یکشنبه کار دارم.', exampleMeaning: 'لدي عمل يوم الأحد.' }
          ],
          grammar: {
            concept: 'الأعداد + المعدود',
            explanation: 'في الفارسية غالبًا يأتي العدد قبل الاسم بدون أداة، والاسم يبقى مفردًا.',
            pattern: '[عدد] + [اسم مفرد]',
            examples: [
              { t: 'دو تا کتاب', r: 'do tâ ketâb', m: 'كتابان' },
              { t: 'سه ساعت', r: 'se sâ\'at', m: 'ثلاث ساعات' }
            ]
          }
        }]
      }]
    }
  },
  stories: [{
    id: 'fa-story-1',
    level: 'A0',
    title: 'در کافه',
    titleAr: 'في المقهى',
    text: [
      { t: 'سلام! اسم من سارا است.', r: 'salâm! esm-e man sârâ ast.', m: 'مرحبًا! اسمي سارة.' },
      { t: 'من دانشجو هستم.', r: 'man dâneshju hastam.', m: 'أنا طالبة.' },
      { t: 'این دوستم علی است.', r: 'in dustam ali ast.', m: 'هذا صديقي علي.' },
      { t: 'او هم دانشجو است.', r: 'u ham dâneshju ast.', m: 'هو أيضًا طالب.' },
      { t: 'ما در کافه هستیم.', r: 'mâ dar kâfe hastim.', m: 'نحن في المقهى.' },
      { t: 'خداحافظ!', r: 'khodâhâfez!', m: 'إلى اللقاء!' }
    ],
    questions: [
      { q: 'اسم البنت؟', options: ['مریم', 'سارا', 'علی', 'لیلا'], answer: 1 },
      { q: 'سارة ماذا تدرس؟', options: ['طالبة', 'معلمة', 'طبيبة', 'مهندسة'], answer: 0 },
      { q: 'أين هم؟', options: ['في البيت', 'في المقهى', 'في المدرسة', 'في السوق'], answer: 1 }
    ]
  }],
  conversations: [{
    level: 'A0', topic: 'التعارف',
    turns: [
      { user: 'سلام!', reply: 'سلام! خوبی؟', replyMeaning: 'مرحبًا! كيف حالك؟' },
      { user: 'خوبم، ممنون. تو چطوری؟', reply: 'منم خوبم، ممنون.', replyMeaning: 'أنا بخير أيضًا، شكرًا.' }
    ]
  }],
  placement: [
    { type: 'mc', skill: 'vocabulary', q: 'ما معنى "ممنون"؟', options: ['نعم', 'شكرًا', 'لا', 'مرحبًا'], answer: 1, level: 'A0' },
    { type: 'mc', skill: 'vocabulary', q: 'ما معنى "خداحافظ"؟', options: ['صباح الخير', 'إلى اللقاء', 'شكرًا', 'كيف حالك'], answer: 1, level: 'A0' },
    { type: 'type', skill: 'vocabulary', q: 'اكتب "نعم" بالفارسية', answer: ['بله', 'bale'], level: 'A0' },
    { type: 'mc', skill: 'grammar', q: 'أي ضمير يعني "أنا"؟', options: ['تو', 'او', 'من', 'ما'], answer: 2, level: 'A0' },
    { type: 'mc', skill: 'grammar', q: 'أكمل: "اسم من مریم ___"', options: ['هستم', 'است', 'هستید', 'هستند'], answer: 1, level: 'A1' }
  ]
};

const TURKISH = {
  code: 'tr',
  name: 'التركية',
  nativeName: 'Türkçe',
  flag: '🇹🇷',
  dir: 'ltr',
  script: 'latin',
  speakers: '~90 مليون',
  ttsLang: 'tr-TR',
  levels: {
    A0: {
      title: 'Başlangıç',
      units: [{
        id: 'tr-a0-u1',
        title: 'Selamlaşma',
        lessons: [
          {
            id: 'tr-a0-u1-l1',
            title: 'Temel Selamlaşma',
            objective: 'أن تُحيّي وتقدّم نفسك بالتركية',
            vocab: [
              { id: 'tr-merhaba', word: 'Merhaba', meaning: 'مرحبا', type: 'تحية',
                example: 'Merhaba, nasılsın?', exampleMeaning: 'مرحبًا، كيف حالك؟' },
              { id: 'tr-nasilsin', word: 'Nasılsın?', meaning: 'كيف حالك؟', type: 'سؤال',
                example: 'Merhaba, nasılsın?', exampleMeaning: 'مرحبًا، كيف حالك؟' },
              { id: 'tr-tesekkurler', word: 'Teşekkürler', meaning: 'شكرًا', type: 'تعبير',
                example: 'İyiyim, teşekkürler.', exampleMeaning: 'أنا بخير، شكرًا.' },
              { id: 'tr-evet', word: 'Evet', meaning: 'نعم', type: 'أداة',
                example: 'Evet, doğru.', exampleMeaning: 'نعم، صحيح.' },
              { id: 'tr-hayir', word: 'Hayır', meaning: 'لا', type: 'أداة',
                example: 'Hayır, değil.', exampleMeaning: 'لا، ليس كذلك.' },
              { id: 'tr-gorusuruz', word: 'Görüşürüz', meaning: 'إلى اللقاء', type: 'تعبير',
                example: 'Görüşürüz, yarın.', exampleMeaning: 'إلى اللقاء غدًا.' }
            ],
            grammar: {
              concept: 'لواحق الفعل -im/-sin/-dir',
              explanation: 'في التركية، الفعل "يكون" يأتي كلاحقة: İyi + -yim = İyiyim.',
              pattern: '[صفة] + yim/sin/dir',
              examples: [
                { t: 'İyiyim', m: 'أنا بخير' },
                { t: 'İyisin', m: 'أنت بخير' },
                { t: 'İyidir', m: 'هو بخير' }
              ]
            }
          },
          {
            id: 'tr-a0-u1-l2',
            title: 'Kendini Tanıtma',
            objective: 'أن تذكر اسمك وجنسيتك',
            vocab: [
              { id: 'tr-adim', word: 'Adım', meaning: 'اسمي', type: 'اسم',
                example: 'Adım Ali.', exampleMeaning: 'اسمي علي.' },
              { id: 'tr-ben', word: 'Ben', meaning: 'أنا', type: 'ضمير',
                example: 'Ben öğrenciyim.', exampleMeaning: 'أنا طالب.' },
              { id: 'tr-sen', word: 'Sen', meaning: 'أنت', type: 'ضمير',
                example: 'Sen nerelisin?', exampleMeaning: 'من أين أنت؟' },
              { id: 'tr-nereli', word: 'Nerelisin?', meaning: 'من أين أنت؟', type: 'سؤال',
                example: 'Sen nerelisin?', exampleMeaning: 'من أين أنت؟' }
            ],
            grammar: {
              concept: 'لاحقة -li "من" للمكان',
              explanation: 'نضيف "-li/-lı" للمكان لنقول "من ذلك المكان".',
              pattern: '[مكان] + li',
              examples: [
                { t: 'İstanbullu', m: 'من إستانبول' },
                { t: 'Mısırlı', m: 'من مصر' }
              ]
            }
          }
        ]
      }]
    },
    A1: {
      title: 'Temel',
      units: [{
        id: 'tr-a1-u1',
        title: 'Günlük Hayat',
        lessons: [{
          id: 'tr-a1-u1-l1',
          title: 'Sayılar',
          objective: 'من 1 إلى 10',
          vocab: [
            { id: 'tr-bir', word: 'Bir', meaning: 'واحد', type: 'عدد', example: 'Bir elma', exampleMeaning: 'تفاحة واحدة' },
            { id: 'tr-iki', word: 'İki', meaning: 'اثنان', type: 'عدد', example: 'İki kitap', exampleMeaning: 'كتابان' },
            { id: 'tr-uc', word: 'Üç', meaning: 'ثلاثة', type: 'عدد', example: 'Üç gün', exampleMeaning: 'ثلاثة أيام' },
            { id: 'tr-dort', word: 'Dört', meaning: 'أربعة', type: 'عدد', example: 'Dört kişi', exampleMeaning: 'أربعة أشخاص' },
            { id: 'tr-bes', word: 'Beş', meaning: 'خمسة', type: 'عدد', example: 'Beş dakika', exampleMeaning: 'خمس دقائق' }
          ],
          grammar: {
            concept: 'تطابق الأعداد مع الأسماء',
            explanation: 'بعد العدد، الاسم يبقى مفردًا في التركية.',
            pattern: '[عدد] + [اسم مفرد]',
            examples: [
              { t: 'İki kedi', m: 'قطتان' },
              { t: 'Üç ev', m: 'ثلاث بيوت' }
            ]
          }
        }]
      }]
    }
  },
  stories: [{
    id: 'tr-story-1', level: 'A0', title: 'Kafede', titleAr: 'في المقهى',
    text: [
      { t: 'Merhaba! Adım Sara.', m: 'مرحبًا! اسمي سارة.' },
      { t: 'Ben öğrenciyim.', m: 'أنا طالبة.' },
      { t: 'Bu arkadaşım Ali.', m: 'هذا صديقي علي.' },
      { t: 'O da öğrenci.', m: 'هو أيضًا طالب.' },
      { t: 'Biz kafedeyiz.', m: 'نحن في المقهى.' },
      { t: 'Görüşürüz!', m: 'إلى اللقاء!' }
    ],
    questions: [
      { q: 'اسم البنت؟', options: ['Ayşe', 'Sara', 'Ali', 'Leyla'], answer: 1 },
      { q: 'أين هم؟', options: ['Evde', 'Kafede', 'Okulda', 'Markette'], answer: 1 }
    ]
  }],
  conversations: [{
    level: 'A0', topic: 'التعارف',
    turns: [
      { user: 'Merhaba!', reply: 'Merhaba! Nasılsın?', replyMeaning: 'مرحبًا! كيف حالك؟' },
      { user: 'İyiyim, teşekkürler.', reply: 'Ben de iyiyim, teşekkürler.', replyMeaning: 'أنا بخير أيضًا، شكرًا.' }
    ]
  }],
  placement: [
    { type: 'mc', skill: 'vocabulary', q: 'ما معنى "Teşekkürler"؟', options: ['نعم', 'شكرًا', 'لا', 'مرحبًا'], answer: 1, level: 'A0' },
    { type: 'mc', skill: 'vocabulary', q: 'ما معنى "Görüşürüz"؟', options: ['صباح الخير', 'إلى اللقاء', 'شكرًا', 'كيف حالك'], answer: 1, level: 'A0' },
    { type: 'type', skill: 'vocabulary', q: 'اكتب "مرحبا" بالتركية', answer: ['merhaba'], level: 'A0' },
    { type: 'mc', skill: 'grammar', q: 'ما هي لاحقة "أنا" في "İyi___"؟', options: ['-sin', '-yim', '-dir', '-iz'], answer: 1, level: 'A0' }
  ]
};

const SPANISH = {
  code: 'es',
  name: 'الإسبانية',
  nativeName: 'Español',
  flag: '🇪🇸',
  dir: 'ltr',
  script: 'latin',
  speakers: '~560 مليون',
  ttsLang: 'es-ES',
  levels: {
    A0: {
      title: 'Principiante',
      units: [{
        id: 'es-a0-u1',
        title: 'Saludos',
        lessons: [
          {
            id: 'es-a0-u1-l1',
            title: 'Saludos básicos',
            objective: 'أن تُحيّي وتقدّم نفسك بالإسبانية',
            vocab: [
              { id: 'es-hola', word: 'Hola', meaning: 'مرحبا', type: 'تحية',
                example: '¡Hola! ¿Cómo estás?', exampleMeaning: 'مرحبًا! كيف حالك؟' },
              { id: 'es-como-estas', word: '¿Cómo estás?', meaning: 'كيف حالك؟', type: 'سؤال',
                example: '¡Hola! ¿Cómo estás?', exampleMeaning: 'مرحبًا! كيف حالك؟' },
              { id: 'es-gracias', word: 'Gracias', meaning: 'شكرًا', type: 'تعبير',
                example: 'Bien, gracias.', exampleMeaning: 'بخير، شكرًا.' },
              { id: 'es-si', word: 'Sí', meaning: 'نعم', type: 'أداة', example: 'Sí, correcto.', exampleMeaning: 'نعم، صحيح.' },
              { id: 'es-no', word: 'No', meaning: 'لا', type: 'أداة', example: 'No, gracias.', exampleMeaning: 'لا، شكرًا.' },
              { id: 'es-adios', word: 'Adiós', meaning: 'إلى اللقاء', type: 'تعبير',
                example: 'Adiós, hasta mañana.', exampleMeaning: 'إلى اللقاء، أراك غدًا.' }
            ],
            grammar: {
              concept: 'Estar للتحيات (estar vs ser)',
              explanation: 'نستخدم "estar" للحالات المؤقتة مثل المزاج والصحة.',
              pattern: 'Yo estoy / Tú estás / Él está',
              examples: [
                { t: 'Estoy bien', m: 'أنا بخير' },
                { t: '¿Estás cansado?', m: 'هل أنت متعب؟' },
                { t: 'Ella está feliz', m: 'هي سعيدة' }
              ]
            }
          },
          {
            id: 'es-a0-u1-l2',
            title: 'Presentarse',
            objective: 'أن تذكر اسمك وأصلك',
            vocab: [
              { id: 'es-me-llamo', word: 'Me llamo', meaning: 'اسمي', type: 'تعبير',
                example: 'Me llamo Sara.', exampleMeaning: 'اسمي سارة.' },
              { id: 'es-yo', word: 'Yo', meaning: 'أنا', type: 'ضمير', example: 'Yo soy estudiante.', exampleMeaning: 'أنا طالب.' },
              { id: 'es-tu', word: 'Tú', meaning: 'أنت', type: 'ضمير', example: '¿Tú de dónde eres?', exampleMeaning: 'من أين أنت؟' },
              { id: 'es-de-donde', word: '¿De dónde eres?', meaning: 'من أين أنت؟', type: 'سؤال',
                example: '¿De dónde eres?', exampleMeaning: 'من أين أنت؟' }
            ],
            grammar: {
              concept: 'Ser للأصل والهوية',
              explanation: 'نستخدم "ser" للجنسية والأصل والصفات الثابتة.',
              pattern: 'Yo soy / Tú eres / Él es',
              examples: [
                { t: 'Soy de Egipto', m: 'أنا من مصر' },
                { t: 'Eres español', m: 'أنت إسباني' }
              ]
            }
          }
        ]
      }]
    },
    A1: {
      title: 'Básico',
      units: [{
        id: 'es-a1-u1',
        title: 'Vida diaria',
        lessons: [{
          id: 'es-a1-u1-l1',
          title: 'Los números',
          objective: 'من 1 إلى 10',
          vocab: [
            { id: 'es-uno', word: 'Uno', meaning: 'واحد', type: 'عدد', example: 'Un libro', exampleMeaning: 'كتاب واحد' },
            { id: 'es-dos', word: 'Dos', meaning: 'اثنان', type: 'عدد', example: 'Dos libros', exampleMeaning: 'كتابان' },
            { id: 'es-tres', word: 'Tres', meaning: 'ثلاثة', type: 'عدد', example: 'Tres días', exampleMeaning: 'ثلاثة أيام' },
            { id: 'es-cuatro', word: 'Cuatro', meaning: 'أربعة', type: 'عدد', example: 'Cuatro personas', exampleMeaning: 'أربعة أشخاص' },
            { id: 'es-cinco', word: 'Cinco', meaning: 'خمسة', type: 'عدد', example: 'Cinco minutos', exampleMeaning: 'خمس دقائق' }
          ],
          grammar: {
            concept: 'جنس الأسماء (el/la)',
            explanation: 'الأسماء في الإسبانية إما مذكرة (el) أو مؤنثة (la).',
            pattern: 'el + اسم مذكر / la + اسم مؤنث',
            examples: [
              { t: 'el libro', m: 'الكتاب (مذكر)' },
              { t: 'la casa', m: 'البيت (مؤنث)' }
            ]
          }
        }]
      }]
    }
  },
  stories: [{
    id: 'es-story-1', level: 'A0', title: 'En el café', titleAr: 'في المقهى',
    text: [
      { t: '¡Hola! Me llamo Sara.', m: 'مرحبًا! اسمي سارة.' },
      { t: 'Soy estudiante.', m: 'أنا طالبة.' },
      { t: 'Este es mi amigo Ali.', m: 'هذا صديقي علي.' },
      { t: 'Él también es estudiante.', m: 'هو أيضًا طالب.' },
      { t: 'Estamos en el café.', m: 'نحن في المقهى.' },
      { t: '¡Adiós!', m: 'إلى اللقاء!' }
    ],
    questions: [
      { q: '¿Cómo se llama la chica?', options: ['María', 'Sara', 'Ali', 'Lola'], answer: 1 },
      { q: '¿Dónde están?', options: ['En casa', 'En el café', 'En la escuela', 'En el mercado'], answer: 1 }
    ]
  }],
  conversations: [{
    level: 'A0', topic: 'التعارف',
    turns: [
      { user: '¡Hola!', reply: '¡Hola! ¿Cómo estás?', replyMeaning: 'مرحبًا! كيف حالك؟' },
      { user: 'Bien, gracias. ¿Y tú?', reply: 'Bien, bien.', replyMeaning: 'بخير، بخير.' }
    ]
  }],
  placement: [
    { type: 'mc', skill: 'vocabulary', q: 'ما معنى "Gracias"؟', options: ['نعم', 'شكرًا', 'لا', 'مرحبًا'], answer: 1, level: 'A0' },
    { type: 'mc', skill: 'vocabulary', q: 'ما معنى "Adiós"؟', options: ['صباح الخير', 'إلى اللقاء', 'شكرًا', 'كيف حالك'], answer: 1, level: 'A0' },
    { type: 'type', skill: 'vocabulary', q: 'اكتب "مرحبا" بالإسبانية', answer: ['hola'], level: 'A0' },
    { type: 'mc', skill: 'grammar', q: 'أي فعل نستخدم مع "bien"؟', options: ['Ser', 'Estar', 'Tener', 'Hacer'], answer: 1, level: 'A0' },
    { type: 'mc', skill: 'grammar', q: 'ما هي أداة التعريف لـ "casa"؟', options: ['el', 'la', 'los', 'las'], answer: 1, level: 'A1' }
  ]
};

export const LANGUAGES = { fa: PERSIAN, tr: TURKISH, es: SPANISH };
export const LANGUAGE_LIST = Object.values(LANGUAGES);

export function getLanguage(code) { return LANGUAGES[code] || null; }

export function getAllVocab(lang) {
  const out = [];
  for (const lvl of Object.values(lang.levels)) {
    for (const unit of lvl.units) {
      for (const lesson of unit.lessons) {
        for (const v of lesson.vocab) out.push({ ...v, lessonId: lesson.id, level: lvl.title });
      }
    }
  }
  return out;
}

export function getAllLessons(lang) {
  const out = [];
  for (const [lvlKey, lvl] of Object.entries(lang.levels)) {
    for (const unit of lvl.units) {
      for (const lesson of unit.lessons) {
        out.push({ ...lesson, levelKey: lvlKey, unitId: unit.id, unitTitle: unit.title });
      }
    }
  }
  return out;
}

export const ACHIEVEMENTS = [
  { id: 'first-lesson', name: 'الخطوة الأولى', desc: 'أكمل أول درس', icon: '🎯' },
  { id: 'first-conversation', name: 'أول محادثة', desc: 'أكمل أول محادثة', icon: '💬' },
  { id: 'first-story', name: 'قارئ مبتدئ', desc: 'اقرأ أول قصة', icon: '📖' },
  { id: 'words-100', name: 'مئة كلمة', desc: 'اكتسب 100 كلمة', icon: '📚' },
  { id: 'words-500', name: 'خمسمئة كلمة', desc: 'اكتسب 500 كلمة', icon: '📚' },
  { id: 'words-1000', name: 'ألف كلمة', desc: 'اكتسب 1000 كلمة', icon: '🏆' },
  { id: 'streak-7', name: '7 أيام', desc: 'حافظ على السلسلة 7 أيام', icon: '🔥' },
  { id: 'streak-30', name: '30 يومًا', desc: 'حافظ على السلسلة 30 يومًا', icon: '🔥' },
  { id: 'streak-100', name: '100 يوم', desc: 'حافظ على السلسلة 100 يوم', icon: '💎' },
  { id: 'grammar-master', name: 'سيد القواعد', desc: 'أكمل 20 درس قواعد بنجاح', icon: '⚙️' },
  { id: 'listening-master', name: 'أذن ذكية', desc: 'أكمل 30 تمرين استماع', icon: '🎧' },
  { id: 'speaking-master', name: 'لسان طليق', desc: 'أكمل 30 تمرين تحدث', icon: '🎙️' }
];
