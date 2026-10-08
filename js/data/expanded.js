// Expanded content — merges into base languages at runtime.

export const EXPANDED = {
  fa: {
    levels: {
      A1: {
        title: 'الأساسيات',
        units: [
          {
            id: 'fa-a1-u2', title: 'الحياة اليومية',
            lessons: [
              {
                id: 'fa-a1-u2-l1', title: 'في السوق',
                objective: 'تسوّق وتفاوض على السعر',
                vocab: [
                  { id: 'fa-bazaar', word: 'بازار', roman: 'bâzâr', meaning: 'سوق', type: 'اسم',
                    example: 'به بازار می‌روم.', exampleMeaning: 'أذهب إلى السوق.' },
                  { id: 'fa-chand', word: 'چند؟', roman: 'chand?', meaning: 'بكم؟', type: 'سؤال',
                    example: 'این چند است؟', exampleMeaning: 'بكم هذا؟' },
                  { id: 'fa-toman', word: 'تومان', roman: 'tumân', meaning: 'تومان (عملة)', type: 'اسم',
                    example: 'پنج هزار تومان.', exampleMeaning: 'خمسة آلاف تومان.' },
                  { id: 'fa-geran', word: 'گران', roman: 'gerân', meaning: 'غالي', type: 'صفة',
                    example: 'این خیلی گران است.', exampleMeaning: 'هذا غالٍ جدًا.' },
                  { id: 'fa-arzun', word: 'ارزان', roman: 'arzun', meaning: 'رخيص', type: 'صفة',
                    example: 'ارزان‌تر داری؟', exampleMeaning: 'هل لديك أرخص؟' },
                  { id: 'fa-mikharam', word: 'می‌خرم', roman: 'mikharam', meaning: 'أشتري', type: 'فعل',
                    example: 'این را می‌خرم.', exampleMeaning: 'أشتري هذا.' },
                  { id: 'fa-pul', word: 'پول', roman: 'pul', meaning: 'مال', type: 'اسم',
                    example: 'پول ندارم.', exampleMeaning: 'ليس لدي مال.' }
                ],
                grammar: {
                  concept: 'صيغة السؤال بـ "چند"',
                  explanation: '"چند" تعني "كم" وتُستخدم للسؤال عن العدد أو السعر.',
                  pattern: 'چند + [اسم] + است؟',
                  examples: [
                    { t: 'این چند است؟', r: 'in chand ast?', m: 'بكم هذا؟' },
                    { t: 'چند نفر آمدند؟', r: 'chand nafar âmadand?', m: 'كم شخصًا جاءوا؟' }
                  ]
                }
              },
              {
                id: 'fa-a1-u2-l2', title: 'في المطعم',
                objective: 'اطلب طعامًا وتعامل مع النادل',
                vocab: [
                  { id: 'fa-restoran', word: 'رستوران', roman: 'restorân', meaning: 'مطعم', type: 'اسم',
                    example: 'به رستوران می‌رویم.', exampleMeaning: 'نذهب إلى المطعم.' },
                  { id: 'fa-menou', word: 'منو', roman: 'menu', meaning: 'قائمة الطعام', type: 'اسم',
                    example: 'منو را لطفاً.', exampleMeaning: 'القائمة من فضلك.' },
                  { id: 'fa-ab', word: 'آب', roman: 'âb', meaning: 'ماء', type: 'اسم',
                    example: 'یک آب لطفاً.', exampleMeaning: 'ماء من فضلك.' },
                  { id: 'fa-nan', word: 'نان', roman: 'nân', meaning: 'خبز', type: 'اسم',
                    example: 'نان تازه است.', exampleMeaning: 'الخبز طازج.' },
                  { id: 'fa-gosht', word: 'گوشت', roman: 'gusht', meaning: 'لحم', type: 'اسم',
                    example: 'گوشت نمی‌خورم.', exampleMeaning: 'لا آكل اللحم.' },
                  { id: 'fa-sofaresh', word: 'سفارش', roman: 'sefâresh', meaning: 'طلب (طعام)', type: 'اسم',
                    example: 'سفارش می‌دهم.', exampleMeaning: 'أطلب الآن.' },
                  { id: 'fa-hesab', word: 'حساب', roman: 'hesâb', meaning: 'الفاتورة', type: 'اسم',
                    example: 'حساب لطفاً.', exampleMeaning: 'الفاتورة من فضلك.' }
                ],
                grammar: {
                  concept: 'الطلب المهذّب بـ "لطفاً"',
                  explanation: '"لطفاً" (من فضلك) تأتي في نهاية الطلب المهذب.',
                  pattern: '[الطعام] + لطفاً',
                  examples: [
                    { t: 'یک چای لطفاً.', r: 'yek chây lotfan.', m: 'شاي من فضلك.' },
                    { t: 'منو را لطفاً.', r: 'menu râ lotfan.', m: 'القائمة من فضلك.' }
                  ]
                }
              },
              {
                id: 'fa-a1-u2-l3', title: 'الاتجاهات',
                objective: 'اسأل عن الطريق وافهم الاتجاهات',
                vocab: [
                  { id: 'fa-kaja', word: 'کجا؟', roman: 'kojâ?', meaning: 'أين؟', type: 'سؤال',
                    example: 'ایستگاه کجاست؟', exampleMeaning: 'أين المحطة؟' },
                  { id: 'fa-rast', word: 'راست', roman: 'râst', meaning: 'يمين / مستقيم', type: 'اسم/صفة',
                    example: 'به راست برو.', exampleMeaning: 'اذهب يمينًا.' },
                  { id: 'fa-chap', word: 'چپ', roman: 'chap', meaning: 'يسار', type: 'اسم/صفة',
                    example: 'به چپ بپیچ.', exampleMeaning: 'انعطف يسارًا.' },
                  { id: 'fa-mostaghim', word: 'مستقیم', roman: 'mostaqim', meaning: 'مستقيم', type: 'صفة',
                    example: 'مستقیم برو.', exampleMeaning: 'اذهب مباشرة.' },
                  { id: 'fa-nazdik', word: 'نزدیک', roman: 'nazdik', meaning: 'قريب', type: 'صفة',
                    example: 'ایستگاه نزدیک است.', exampleMeaning: 'المحطة قريبة.' },
                  { id: 'fa-dur', word: 'دور', roman: 'dur', meaning: 'بعيد', type: 'صفة',
                    example: 'خیلی دور است.', exampleMeaning: 'بعيد جدًا.' }
                ],
                grammar: {
                  concept: 'فعل الأمر (برو، بیا)',
                  explanation: 'فعل الأمر في الفارسية يُصاغ بإضافة "بـ" إلى جذر المضارع.',
                  pattern: 'بـ + [جذر الفعل]',
                  examples: [
                    { t: 'برو!', r: 'boro!', m: 'اذهب!' },
                    { t: 'بیا!', r: 'biyâ!', m: 'تعال!' }
                  ]
                }
              }
            ]
          },
          {
            id: 'fa-a1-u3', title: 'الوقت والعائلة',
            lessons: [
              {
                id: 'fa-a1-u3-l1', title: 'الساعة',
                objective: 'اسأل عن الوقت وأخبر به',
                vocab: [
                  { id: 'fa-saat-chand', word: 'ساعت چند است؟', roman: 'sâ\'at chand ast?', meaning: 'كم الساعة؟', type: 'سؤال',
                    example: 'ببخشید، ساعت چند است؟', exampleMeaning: 'عذرًا، كم الساعة؟' },
                  { id: 'fa-saat', word: 'ساعت', roman: 'sâ\'at', meaning: 'ساعة', type: 'اسم',
                    example: 'ساعت سه است.', exampleMeaning: 'الساعة الثالثة.' },
                  { id: 'fa-daqiqe', word: 'دقیقه', roman: 'daqiqe', meaning: 'دقيقة', type: 'اسم',
                    example: 'پنج دقیقه صبر کن.', exampleMeaning: 'انتظر خمس دقائق.' },
                  { id: 'fa-sobh', word: 'صبح', roman: 'sobh', meaning: 'صباح', type: 'اسم',
                    example: 'صبح بخیر.', exampleMeaning: 'صباح الخير.' },
                  { id: 'fa-shab', word: 'شب', roman: 'shab', meaning: 'ليل', type: 'اسم',
                    example: 'شب بخیر.', exampleMeaning: 'مساء الخير.' }
                ],
                grammar: {
                  concept: 'قول الساعة',
                  explanation: 'نقول "ساعت + [العدد] + است" للساعة الكاملة، ونضيف "و" للدقائق.',
                  pattern: 'ساعت [العدد] (و [دقائق]) است',
                  examples: [
                    { t: 'ساعت پنج است.', r: 'sâ\'at panj ast.', m: 'الساعة الخامسة.' },
                    { t: 'ساعت سه و ربع است.', r: 'sâ\'at se o rob\' ast.', m: 'الثالثة والربع.' }
                  ]
                }
              },
              {
                id: 'fa-a1-u3-l2', title: 'العائلة',
                objective: 'تتحدث عن عائلتك',
                vocab: [
                  { id: 'fa-khanevade', word: 'خانواده', roman: 'khânevâde', meaning: 'عائلة', type: 'اسم',
                    example: 'خانواده‌ام در تهران است.', exampleMeaning: 'عائلتي في طهران.' },
                  { id: 'fa-pedar', word: 'پدر', roman: 'pedar', meaning: 'أب', type: 'اسم',
                    example: 'پدرم پزشک است.', exampleMeaning: 'أبي طبيب.' },
                  { id: 'fa-madar', word: 'مادر', roman: 'mâdar', meaning: 'أم', type: 'اسم',
                    example: 'مادرم معلم است.', exampleMeaning: 'أمي معلمة.' },
                  { id: 'fa-baradar', word: 'برادر', roman: 'barâdar', meaning: 'أخ', type: 'اسم',
                    example: 'یک برادر دارم.', exampleMeaning: 'لدي أخ واحد.' },
                  { id: 'fa-khahar', word: 'خواهر', roman: 'khâhar', meaning: 'أخت', type: 'اسم',
                    example: 'خواهرم بزرگ‌تر است.', exampleMeaning: 'أختي أكبر.' },
                  { id: 'fa-pesar', word: 'پسر', roman: 'pesar', meaning: 'ابن / ولد', type: 'اسم',
                    example: 'دو پسر دارم.', exampleMeaning: 'لدي ابنان.' },
                  { id: 'fa-dokhtar', word: 'دختر', roman: 'dokhtar', meaning: 'ابنة / بنت', type: 'اسم',
                    example: 'دخترم کوچک است.', exampleMeaning: 'ابنتي صغيرة.' }
                ],
                grammar: {
                  concept: 'لاحقة الملكية (ـم، ـت، ـش)',
                  explanation: 'نضيف لاحقة إلى الاسم للتعبير عن الملكية.',
                  pattern: '[اسم] + ـم / ـت / ـش / ـمان / ـتان / ـشان',
                  examples: [
                    { t: 'پدرم', r: 'pedaram', m: 'أبي' },
                    { t: 'مادرت', r: 'mâdarat', m: 'أمك' },
                    { t: 'خانه‌اش', r: 'khâne-ash', m: 'بيته' }
                  ]
                }
              }
            ]
          }
        ]
      }
    },
    stories: [
      {
        id: 'fa-story-2', level: 'A1', title: 'در بازار', titleAr: 'في السوق',
        text: [
          { t: 'دیروز به بازار رفتم.', r: 'diruz be bâzâr raftam.', m: 'أمس ذهبت إلى السوق.' },
          { t: 'می‌خواستم میوه بخرم.', r: 'mikhâstam mive beKharam.', m: 'كنت أريد شراء فاكهة.' },
          { t: 'از فروشنده پرسیدم: این سیب چند است؟', r: 'az forushande porsidam: in sib chand ast?', m: 'سألت البائع: بكم هذا التفاح؟' },
          { t: 'گفت: کیلویی ده هزار تومان.', r: 'goft: kiluyi dah hezâr tumân.', m: 'قال: عشرة آلاف تومان للكيلو.' },
          { t: 'گفتم: گران است، ارزان‌تر می‌دهی؟', r: 'goftam: gerân ast, arzun-tar midehi?', m: 'قلت: غالٍ، هل تعطيني أرخص؟' },
          { t: 'خندید و گفت: هشت هزار تومان.', r: 'khandid o goft: hasht hezâr tumân.', m: 'ضحك وقال: ثمانية آلاف تومان.' },
          { t: 'دو کیلو خریدم و به خانه برگشتم.', r: 'do kilu kharidam o be khâne bargashtam.', m: 'اشتريت كيلوين وعدت إلى البيت.' }
        ],
        questions: [
          { q: 'أين ذهب الراوي؟', options: ['إلى المطعم', 'إلى السوق', 'إلى المدرسة', 'إلى البيت'], answer: 1 },
          { q: 'ماذا أراد أن يشتري؟', options: ['خبزًا', 'لحمًا', 'فاكهة', 'ماءً'], answer: 2 },
          { q: 'كم السعر بعد التفاوض؟', options: ['10 آلاف', '8 آلاف', '5 آلاف', '12 ألف'], answer: 1 }
        ]
      }
    ],
    conversations: [
      { level: 'A1', topic: 'السوق', turns: [
        { user: 'ببخشید، این چند است؟', reply: 'کیلویی ده هزار تومان.', replyMeaning: 'عشرة آلاف تومان للكيلو.' },
        { user: 'گران است. ارزان‌تر داری؟', reply: 'هشت هزار تومان می‌دهم.', replyMeaning: 'أعطيك بثمانية آلاف.' }
      ]}
    ],
    placement: [
      { type: 'mc', skill: 'vocabulary', q: 'ما معنى "بازار"؟', options: ['مطعم', 'سوق', 'بيت', 'مدرسة'], answer: 1, level: 'A1' },
      { type: 'mc', skill: 'grammar', q: 'كيف تقول "اذهب!"؟', options: ['رفتن', 'می‌روم', 'برو', 'رفت'], answer: 2, level: 'A1' }
    ]
  },
  tr: {
    levels: {
      A1: {
        title: 'Temel',
        units: [
          {
            id: 'tr-a1-u2', title: 'Alışveriş',
            lessons: [
              {
                id: 'tr-a1-u2-l1', title: 'Pazarda',
                objective: 'تتسوّق وتفاوض بالتركية',
                vocab: [
                  { id: 'tr-pazar', word: 'Pazar', meaning: 'سوق', type: 'اسم', example: 'Pazara gidiyorum.', exampleMeaning: 'أذهب إلى السوق.' },
                  { id: 'tr-ne-kadar', word: 'Ne kadar?', meaning: 'بكم؟', type: 'سؤال', example: 'Bu ne kadar?', exampleMeaning: 'بكم هذا؟' },
                  { id: 'tr-pahali', word: 'Pahalı', meaning: 'غالي', type: 'صفة', example: 'Bu çok pahalı.', exampleMeaning: 'هذا غالٍ جدًا.' },
                  { id: 'tr-ucuz', word: 'Ucuz', meaning: 'رخيص', type: 'صفة', example: 'Daha ucuz var mı?', exampleMeaning: 'هل يوجد أرخص؟' },
                  { id: 'tr-aliyorum', word: 'Alıyorum', meaning: 'أشتري', type: 'فعل', example: 'Bunu alıyorum.', exampleMeaning: 'أشتري هذا.' },
                  { id: 'tr-para', word: 'Para', meaning: 'مال', type: 'اسم', example: 'Param yok.', exampleMeaning: 'ليس لدي مال.' }
                ],
                grammar: {
                  concept: 'حالة -a/-e (الاتجاه إلى)',
                  explanation: 'نضيف "-a/-e" حسب قاعدة التوافق الصوتي للتعبير عن "إلى".',
                  pattern: '[اسم] + a/e',
                  examples: [
                    { t: 'Pazara', m: 'إلى السوق' },
                    { t: 'Eve', m: 'إلى البيت' }
                  ]
                }
              },
              {
                id: 'tr-a1-u2-l2', title: 'Restoranda',
                objective: 'اطلب طعامًا في مطعم',
                vocab: [
                  { id: 'tr-restoran', word: 'Restoran', meaning: 'مطعم', type: 'اسم', example: 'Restorana gidiyoruz.', exampleMeaning: 'نذهب إلى المطعم.' },
                  { id: 'tr-menu', word: 'Menü', meaning: 'قائمة الطعام', type: 'اسم', example: 'Menüyü alabilir miyim?', exampleMeaning: 'هل آخذ القائمة؟' },
                  { id: 'tr-su', word: 'Su', meaning: 'ماء', type: 'اسم', example: 'Bir su lütfen.', exampleMeaning: 'ماء من فضلك.' },
                  { id: 'tr-ekmek', word: 'Ekmek', meaning: 'خبز', type: 'اسم', example: 'Ekmek taze.', exampleMeaning: 'الخبز طازج.' },
                  { id: 'tr-et', word: 'Et', meaning: 'لحم', type: 'اسم', example: 'Et yemiyorum.', exampleMeaning: 'لا آكل اللحم.' },
                  { id: 'tr-hesap', word: 'Hesap', meaning: 'الفاتورة', type: 'اسم', example: 'Hesap lütfen.', exampleMeaning: 'الفاتورة من فضلك.' }
                ],
                grammar: {
                  concept: 'لاحقة -abil/-ebil (القدرة)',
                  explanation: 'نضيف "-abil/-ebil" للفعل للتعبير عن "يمكن أن".',
                  pattern: '[فعل] + abil/ebil',
                  examples: [
                    { t: 'Alabilir miyim?', m: 'هل يمكنني الأخذ؟' },
                    { t: 'Yardım edebilir misin?', m: 'هل يمكنك المساعدة؟' }
                  ]
                }
              }
            ]
          }
        ]
      }
    },
    stories: [
      {
        id: 'tr-story-2', level: 'A1', title: 'Pazarda', titleAr: 'في السوق',
        text: [
          { t: 'Dün pazara gittim.', m: 'أمس ذهبت إلى السوق.' },
          { t: 'Meyve almak istedim.', m: 'أردت شراء فاكهة.' },
          { t: 'Satıcıya sordum: Bu elma ne kadar?', m: 'سألت البائع: بكم هذا التفاح؟' },
          { t: 'Dedi: Kilosu on lira.', m: 'قال: عشرة ليرات للكيلو.' },
          { t: 'Çok pahalı, dedim.', m: 'قلت: غالٍ جدًا.' },
          { t: 'Güldü ve sekiz liraya indi.', m: 'ضحك ونزل إلى ثماني ليرات.' },
          { t: 'İki kilo aldım ve eve döndüm.', m: 'اشتريت كيلوين وعدت إلى البيت.' }
        ],
        questions: [
          { q: 'Nereye gitti?', options: ['Restorana', 'Pazara', 'Okula', 'Eve'], answer: 1 },
          { q: 'Ne almak istedi?', options: ['Ekmek', 'Et', 'Meyve', 'Su'], answer: 2 },
          { q: 'Son fiyat ne oldu?', options: ['10 lira', '8 lira', '5 lira', '12 lira'], answer: 1 }
        ]
      }
    ],
    conversations: [
      { level: 'A1', topic: 'السوق', turns: [
        { user: 'Affedersiniz, bu ne kadar?', reply: 'Kilosu on lira.', replyMeaning: 'عشرة ليرات للكيلو.' },
        { user: 'Çok pahalı. Daha ucuz var mı?', reply: 'Sekiz lira olur.', replyMeaning: 'يكون بثماني ليرات.' }
      ]}
    ],
    placement: [
      { type: 'mc', skill: 'vocabulary', q: 'ما معنى "Pazar"؟', options: ['مطعم', 'سوق', 'بيت', 'مدرسة'], answer: 1, level: 'A1' },
      { type: 'mc', skill: 'grammar', q: 'كيف تقول "إلى السوق"؟', options: ['Pazar', 'Pazara', 'Pazarda', 'Pazardan'], answer: 1, level: 'A1' }
    ]
  },
  es: {
    levels: {
      A1: {
        title: 'Básico',
        units: [
          {
            id: 'es-a1-u2', title: 'De compras',
            lessons: [
              {
                id: 'es-a1-u2-l1', title: 'En el mercado',
                objective: 'تتسوّق وتفاوض بالإسبانية',
                vocab: [
                  { id: 'es-mercado', word: 'Mercado', meaning: 'سوق', type: 'اسم', example: 'Voy al mercado.', exampleMeaning: 'أذهب إلى السوق.' },
                  { id: 'es-cuanto', word: '¿Cuánto?', meaning: 'بكم؟', type: 'سؤال', example: '¿Cuánto cuesta?', exampleMeaning: 'بكم هذا؟' },
                  { id: 'es-caro', word: 'Caro', meaning: 'غالي', type: 'صفة', example: 'Es muy caro.', exampleMeaning: 'غالٍ جدًا.' },
                  { id: 'es-barato', word: 'Barato', meaning: 'رخيص', type: 'صفة', example: '¿Tienes algo más barato?', exampleMeaning: 'هل لديك أرخص؟' },
                  { id: 'es-compro', word: 'Compro', meaning: 'أشتري', type: 'فعل', example: 'Compro esto.', exampleMeaning: 'أشتري هذا.' },
                  { id: 'es-dinero', word: 'Dinero', meaning: 'مال', type: 'اسم', example: 'No tengo dinero.', exampleMeaning: 'ليس لدي مال.' }
                ],
                grammar: {
                  concept: 'الفعل IR (الذهاب)',
                  explanation: 'فعل شاذ: voy, vas, va, vamos, vais, van. يُستخدم مع "a" للاتجاه.',
                  pattern: 'ir + a + [مكان]',
                  examples: [
                    { t: 'Voy al mercado', m: 'أذهب إلى السوق' },
                    { t: '¿Vas a la tienda?', m: 'هل تذهب إلى المتجر؟' }
                  ]
                }
              },
              {
                id: 'es-a1-u2-l2', title: 'En el restaurante',
                objective: 'اطلب طعامًا في مطعم',
                vocab: [
                  { id: 'es-restaurante', word: 'Restaurante', meaning: 'مطعم', type: 'اسم', example: 'Vamos al restaurante.', exampleMeaning: 'نذهب إلى المطعم.' },
                  { id: 'es-menu', word: 'Menú', meaning: 'قائمة الطعام', type: 'اسم', example: 'El menú, por favor.', exampleMeaning: 'القائمة من فضلك.' },
                  { id: 'es-agua', word: 'Agua', meaning: 'ماء', type: 'اسم', example: 'Un agua, por favor.', exampleMeaning: 'ماء من فضلك.' },
                  { id: 'es-pan', word: 'Pan', meaning: 'خبز', type: 'اسم', example: 'El pan está fresco.', exampleMeaning: 'الخبز طازج.' },
                  { id: 'es-carne', word: 'Carne', meaning: 'لحم', type: 'اسم', example: 'No como carne.', exampleMeaning: 'لا آكل اللحم.' },
                  { id: 'es-cuenta', word: 'Cuenta', meaning: 'الفاتورة', type: 'اسم', example: 'La cuenta, por favor.', exampleMeaning: 'الفاتورة من فضلك.' }
                ],
                grammar: {
                  concept: 'الفعل PODER (القدرة)',
                  explanation: 'فعل شاذ: puedo, puedes, puede… يستخدم للطلب المهذب.',
                  pattern: '¿Puedo/Puedes + [مصدر]?',
                  examples: [
                    { t: '¿Puedo ver el menú?', m: 'هل يمكنني رؤية القائمة؟' },
                    { t: '¿Puedes traer agua?', m: 'هل يمكنك إحضار ماء؟' }
                  ]
                }
              }
            ]
          }
        ]
      }
    },
    stories: [
      {
        id: 'es-story-2', level: 'A1', title: 'En el mercado', titleAr: 'في السوق',
        text: [
          { t: 'Ayer fui al mercado.', m: 'أمس ذهبت إلى السوق.' },
          { t: 'Quería comprar fruta.', m: 'أردت شراء فاكهة.' },
          { t: 'Pregunté al vendedor: ¿Cuánto cuesta esta manzana?', m: 'سألت البائع: بكم هذا التفاح؟' },
          { t: 'Dijo: Diez pesos el kilo.', m: 'قال: عشرة بيسوس للكيلو.' },
          { t: 'Dije: Es muy caro.', m: 'قلت: غالٍ جدًا.' },
          { t: 'Se rió y bajó a ocho pesos.', m: 'ضحك ونزل إلى ثمانية بيسوس.' },
          { t: 'Compré dos kilos y volví a casa.', m: 'اشتريت كيلوين وعدت إلى البيت.' }
        ],
        questions: [
          { q: '¿Adónde fue?', options: ['Al restaurante', 'Al mercado', 'A la escuela', 'A casa'], answer: 1 },
          { q: '¿Qué quería comprar?', options: ['Pan', 'Carne', 'Fruta', 'Agua'], answer: 2 },
          { q: '¿Cuál fue el precio final?', options: ['10', '8', '5', '12'], answer: 1 }
        ]
      }
    ],
    conversations: [
      { level: 'A1', topic: 'السوق', turns: [
        { user: 'Disculpe, ¿cuánto cuesta?', reply: 'Diez pesos el kilo.', replyMeaning: 'عشرة بيسوس للكيلو.' },
        { user: 'Es muy caro. ¿Más barato?', reply: 'Puedo dejarlo en ocho.', replyMeaning: 'يمكنني أن أجعله بثمانية.' }
      ]}
    ],
    placement: [
      { type: 'mc', skill: 'vocabulary', q: 'ما معنى "Mercado"؟', options: ['مطعم', 'سوق', 'بيت', 'مدرسة'], answer: 1, level: 'A1' },
      { type: 'mc', skill: 'grammar', q: 'كيف نقول "أذهب إلى السوق"؟', options: ['Voy mercado', 'Voy al mercado', 'Voy en mercado', 'Voy del mercado'], answer: 1, level: 'A1' }
    ]
  }
};

export function mergeExpanded(languages) {
  for (const [code, exp] of Object.entries(EXPANDED)) {
    const base = languages[code];
    if (!base) continue;

    if (exp.levels) {
      for (const [lvlKey, lvlData] of Object.entries(exp.levels)) {
        if (!base.levels[lvlKey]) base.levels[lvlKey] = lvlData;
        else {
          const existingIds = new Set(base.levels[lvlKey].units.map(u => u.id));
          for (const u of lvlData.units) if (!existingIds.has(u.id)) base.levels[lvlKey].units.push(u);
        }
      }
    }

    if (exp.stories) {
      base.stories ||= [];
      const ids = new Set(base.stories.map(s => s.id));
      for (const s of exp.stories) if (!ids.has(s.id)) base.stories.push(s);
    }

    if (exp.conversations) {
      base.conversations ||= [];
      const ids = new Set(base.conversations.map(c => c.id || c.topic));
      for (const c of exp.conversations) if (!ids.has(c.id || c.topic)) base.conversations.push(c);
    }

    if (exp.placement) {
      base.placement ||= [];
      base.placement.push(...exp.placement);
    }
  }
  return languages;
}

export const WRITING_PROMPTS = {
  fa: [
    { id: 'fa-w-a1-1', level: 'A1', prompt: 'اكتب 3 جمل عن يومك', hint: 'استخدم: صبح، کار، شب',
      keywords: ['صبح', 'شب', 'کار', 'رفتم', 'خوردم'] },
    { id: 'fa-w-a1-2', level: 'A1', prompt: 'صف غرفتك', hint: 'استخدم: اتاق، تخت، میز',
      keywords: ['اتاق', 'تخت', 'میز', 'در', 'پنجره'] }
  ],
  tr: [
    { id: 'tr-w-a1-1', level: 'A1', prompt: 'اكتب 3 جمل عن يومك', hint: 'استخدم: sabah, iş, akşam',
      keywords: ['sabah', 'akşam', 'iş', 'gittim', 'yemek'] },
    { id: 'tr-w-a1-2', level: 'A1', prompt: 'صف غرفتك', hint: 'استخدم: oda, yatak, masa',
      keywords: ['oda', 'yatak', 'masa', 'kapı', 'pencere'] }
  ],
  es: [
    { id: 'es-w-a1-1', level: 'A1', prompt: 'اكتب 3 جمل عن يومك', hint: 'استخدم: mañana, trabajo, noche',
      keywords: ['mañana', 'noche', 'trabajo', 'fui', 'comí'] },
    { id: 'es-w-a1-2', level: 'A1', prompt: 'صف غرفتك', hint: 'استخدم: habitación, cama, mesa',
      keywords: ['habitación', 'cama', 'mesa', 'puerta', 'ventana'] }
  ]
};

export const TRANSLATION_DRILLS = {
  fa: [
    { id: 'fa-tr-a1-1', level: 'A1', dir: 'ar2t', ar: 'صباح الخير، كيف حالك؟', target: 'صبح بخیر، حال شما چطور است؟', accept: ['صبح بخیر، خوبی؟', 'صبح بخیر، چطوری؟'] },
    { id: 'fa-tr-a1-2', level: 'A1', dir: 'ar2t', ar: 'اسمي علي، أنا من إيران.', target: 'اسم من علی است، من اهل ایران هستم.', accept: ['اسمم علی است، اهل ایران هستم'] },
    { id: 'fa-tr-a1-3', level: 'A1', dir: 't2ar', target: 'ممنون، خوبم.', ar: 'شكرًا، أنا بخير.', accept: ['شكرا انا بخير', 'شكرًا بخير'] }
  ],
  tr: [
    { id: 'tr-tr-a1-1', level: 'A1', dir: 'ar2t', ar: 'صباح الخير، كيف حالك؟', target: 'Günaydın, nasılsın?', accept: ['Günaydın, nasılsın'] },
    { id: 'tr-tr-a1-2', level: 'A1', dir: 'ar2t', ar: 'اسمي علي، أنا من مصر.', target: 'Adım Ali, Mısırlıyım.', accept: ['Benim adım Ali, Mısırlıyım'] },
    { id: 'tr-tr-a1-3', level: 'A1', dir: 't2ar', target: 'Teşekkürler, iyiyim.', ar: 'شكرًا، أنا بخير.', accept: ['شكرا انا بخير', 'شكرا بخير'] }
  ],
  es: [
    { id: 'es-tr-a1-1', level: 'A1', dir: 'ar2t', ar: 'صباح الخير، كيف حالك؟', target: 'Buenos días, ¿cómo estás?', accept: ['Buenos días, cómo estás'] },
    { id: 'es-tr-a1-2', level: 'A1', dir: 'ar2t', ar: 'اسمي علي، أنا من مصر.', target: 'Me llamo Ali, soy de Egipto.', accept: ['Me llamo Ali soy de Egipto'] },
    { id: 'es-tr-a1-3', level: 'A1', dir: 't2ar', target: 'Gracias, estoy bien.', ar: 'شكرًا، أنا بخير.', accept: ['شكرا انا بخير', 'شكرا بخير'] }
  ]
};
