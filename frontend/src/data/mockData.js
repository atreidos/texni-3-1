// ============================================================
// МОКОВЫЕ ДАННЫЕ — заглушки для разработки фронтенда
// В реальном проекте всё это приходит с бэкенда через API
// ============================================================

// Текущий авторизованный пользователь
export const mockUser = {
  id: 1,
  name: 'Иван Петров',
  email: 'ivan@example.com',
  phone: '+7 (916) 123-45-67',
  avatar: null,            // null → показываем инициалы
  plan: 'pro',             // 'free' | 'pro' | 'business'
  planExpires: '2026-06-30',
  docsUsed: 18,
  docsLimit: 50,
};

// Список документов пользователя
export const mockDocuments = [
  {
    id: 1,
    name: 'Договор оказания услуг №12',
    type: 'docx',
    organization: 'ООО «Альфа Медиа»',
    updatedAt: '2026-03-10',
    status: 'signed',      // 'draft' | 'filled' | 'signed'
    size: '48 КБ',
  },
  {
    id: 2,
    name: 'Акт выполненных работ',
    type: 'pdf',
    organization: 'ИП Сидоров А.В.',
    updatedAt: '2026-03-08',
    status: 'filled',
    size: '120 КБ',
  },
  {
    id: 3,
    name: 'Счёт на оплату №45',
    type: 'docx',
    organization: 'ООО «Альфа Медиа»',
    updatedAt: '2026-03-05',
    status: 'draft',
    size: '32 КБ',
  },
  {
    id: 4,
    name: 'Доверенность на представление интересов',
    type: 'pdf',
    organization: 'ООО «Бета Строй»',
    updatedAt: '2026-02-28',
    status: 'signed',
    size: '85 КБ',
  },
  {
    id: 5,
    name: 'Коммерческое предложение',
    type: 'docx',
    organization: 'ИП Сидоров А.В.',
    updatedAt: '2026-02-20',
    status: 'draft',
    size: '56 КБ',
  },
];

// Организации пользователя
export const mockOrganizations = [
  {
    id: 1,
    name: 'ООО «Альфа Медиа»',
    inn: '7701234567',
    kpp: '770101001',
    ogrn: '1027700132195',
    address: 'г. Москва, ул. Тверская, д. 10, офис 305',
    phone: '+7 (495) 123-45-67',
    email: 'info@alphamedia.ru',
    isMain: true,
    bank: {
      bik: '044525225',
      bankName: 'ПАО Сбербанк',
      checkingAccount: '40702810938000012345',
      correspondentAccount: '30101810400000000225',
    },
  },
  {
    id: 2,
    name: 'ИП Сидоров А.В.',
    inn: '771098765432',
    kpp: '',
    ogrn: '319774600123456',
    address: 'г. Москва, ул. Арбат, д. 5, кв. 12',
    phone: '+7 (916) 987-65-43',
    email: 'sidorov@mail.ru',
    isMain: false,
    bank: {
      bik: '044525974',
      bankName: 'АО Тинькофф Банк',
      checkingAccount: '40802810400001234567',
      correspondentAccount: '30101810145250000974',
    },
  },
];

// Подписи тарифов для отображения (free/pro/business)
export const PLAN_LABELS = { free: 'Бесплатно', pro: 'Про', business: 'Бизнес' };

// Тарифные планы
export const mockPlans = [
  {
    id: 'free',
    name: 'Бесплатно',
    price: 0,
    period: 'навсегда',
    color: 'gray',
    features: [
      { text: '5 документов в месяц', included: true },
      { text: 'Заполнение полей вручную', included: true },
      { text: 'Скачивание документа', included: true },
      { text: 'ИИ-заполнение', included: false },
      { text: 'ЭЦП', included: false },
      { text: 'Организации', included: false },
      { text: 'Приоритетная поддержка', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Про',
    price: 590,
    period: 'мес',
    color: 'blue',
    popular: true,
    features: [
      { text: '50 документов в месяц', included: true },
      { text: 'Заполнение полей вручную', included: true },
      { text: 'Скачивание документа', included: true },
      { text: 'ИИ-заполнение', included: true },
      { text: 'ЭЦП', included: true },
      { text: '3 организации', included: true },
      { text: 'Приоритетная поддержка', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Бизнес',
    price: 1990,
    period: 'мес',
    color: 'purple',
    features: [
      { text: 'Безлимитные документы', included: true },
      { text: 'Заполнение полей вручную', included: true },
      { text: 'Скачивание документа', included: true },
      { text: 'ИИ-заполнение', included: true },
      { text: 'ЭЦП', included: true },
      { text: 'Неограниченно организаций', included: true },
      { text: 'Приоритетная поддержка', included: true },
    ],
  },
];

// История платежей
export const mockPayments = [
  { id: 1, date: '2026-03-01', plan: 'Про', amount: 590, status: 'success' },
  { id: 2, date: '2026-02-01', plan: 'Про', amount: 590, status: 'success' },
  { id: 3, date: '2026-01-01', plan: 'Про', amount: 590, status: 'success' },
];

// Поля документа (автоматически обнаруженные — заглушка)
export const mockDocumentFields = [
  // Группа: Организация
  { id: 'org_name', group: 'organization', label: 'Название организации', value: 'ООО «Альфа Медиа»', type: 'text' },
  { id: 'org_inn', group: 'organization', label: 'ИНН', value: '7701234567', type: 'text' },
  { id: 'org_kpp', group: 'organization', label: 'КПП', value: '770101001', type: 'text' },
  { id: 'org_address', group: 'organization', label: 'Юридический адрес', value: '', type: 'text' },
  // Группа: Контрагент
  { id: 'contractor_name', group: 'contractor', label: 'Контрагент', value: '', type: 'text' },
  { id: 'contractor_inn', group: 'contractor', label: 'ИНН контрагента', value: '', type: 'text' },
  // Группа: Прочее
  { id: 'doc_date', group: 'other', label: 'Дата договора', value: '2026-03-11', type: 'date' },
  { id: 'doc_number', group: 'other', label: 'Номер договора', value: '12', type: 'text' },
  { id: 'amount', group: 'other', label: 'Сумма', value: '150000', type: 'number' },
];

// Отзывы клиентов
export const mockTestimonials = [
  {
    id: 1,
    name: 'Анна Соколова',
    role: 'Юрист, ООО «ЮрПроф»',
    text: 'Раньше тратила час на заполнение типовых договоров. Теперь — 5 минут. Реквизиты подставляются автоматически.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Михаил Зайцев',
    role: 'ИП, веб-разработчик',
    text: 'Удобно, что можно сразу подписать ЭЦП и отправить клиенту. Экономия времени колоссальная.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Елена Козлова',
    role: 'Бухгалтер, малый бизнес',
    text: 'Наконец-то нормальный сервис для документов без лишних кнопок. Просто загрузил — заполнил — скачал.',
    rating: 4,
  },
];
