Все диаграммы переписаны в формат **Mermaid** (совместим с GitHub Markdown, Obsidian, MkDocs и др.). Для C4 Context я использовал `flowchart` с нотацией границ (subgraph), что визуально аналогично C4.

---

## 1. C4 Context Diagram (Mermaid)

```mermaid
flowchart TD
    User[("Пользователь")]
    LIFA[("FileSort Organizer<br>Локальный интеллектуальный органайзер")]
    FS[("Файловая система ОС<br>Источник и цель файлов")]
    LLM[("Локальная LLM<br>(Ollama/llama.cpp)")]
    Notify[("Система уведомлений ОС<br>(трей, диалоги)")]

    User -->|Настраивает папки,<br>подтверждает действия| LIFA
    LIFA -->|Отслеживает, читает,<br>перемещает файлы| FS
    LIFA -->|HTTP запросы на инференс| LLM
    LIFA -->|Показывает диалоги<br>и уведомления| Notify

    subgraph Boundary [Локальный компьютер пользователя]
        LIFA
        FS
        LLM
        Notify
    end
```

---

## 2. C4 Container Diagram (Mermaid)

```mermaid
flowchart TB
    User[("Пользователь")]

    subgraph LIFA_System ["FileSort Organizer"]
        DesktopApp["Desktop Application<br>Python + PyQt<br>Orchestrator, Watcher, UI"]
        Queue["Queue<br>Python queue.Queue<br>Асинхронная очередь задач"]
        SQLiteDB["SQLite Database<br>Кэш, правила, настройки"]
        JSONLogs["JSON Logs<br>Логи без содержимого"]
    end

    FS[("File System (ОС)")]
    LLMService[("LLM Service<br>Ollama / llama.cpp")]
    TrayUI[("Tray & Dialog UI<br>(ОС)")]

    User -->|Использует, настраивает,<br>подтверждает| DesktopApp
    DesktopApp -->|Помещает события| Queue
    Queue -->|Забирает задачи| DesktopApp
    DesktopApp -->|Читает/пишет| SQLiteDB
    DesktopApp -->|Пишет логи| JSONLogs
    DesktopApp -->|Читает файлы,<br>перемещает| FS
    DesktopApp -->|HTTP /generate| LLMService
    DesktopApp -->|Показывает диалоги| TrayUI
```

---

## 3. C4 Component Diagram (ядро Desktop App) – Mermaid

```mermaid
flowchart LR
    subgraph DesktopApp ["Desktop Application (Python)"]
        Watcher["Watcher<br>(watchdog)"]
        QueueMgr["QueueManager<br>(queue.Queue)"]
        Extractor["Extractor<br>(python-docx, PyPDF2, PIL, ...)"]
        Security["SecurityScanner<br>(AST + regex)"]
        ModelSelector["ModelSelector<br>(benchmark + config)"]
        LLMClient["LLMClient<br>(requests)"]
        Decision["DecisionEngine<br>(пороги + правила)"]
        ConfirmUI["ConfirmationDialog<br>(PyQt)"]
        FileMover["FileMover<br>(shutil)"]
        ConfigStore["ConfigStore<br>(SQLite + YAML)"]
        Logger["Logger<br>(logging + JSON)"]
    end

    FS[("File System")]
    LLM[("LLM Service")]
    UISys[("OS UI")]

    Watcher -->|событие| QueueMgr
    QueueMgr -->|задача| Extractor
    Extractor -->|код скрипта| Security
    Extractor -->|текст/мета| ModelSelector
    ModelSelector -->|выбор модели| LLMClient
    LLMClient -->|категория, папка, уверенность| Decision
    Security -->|флаги риска| Decision
    Decision -->|запрос подтверждения| ConfirmUI
    ConfirmUI -->|ответ| Decision
    Decision -->|команда перемещения| FileMover
    FileMover -->|физическое перемещение| FS
    Decision -->|чтение правил/порогов| ConfigStore
    Extractor -->|логи| Logger
    LLMClient -->|логи| Logger
    Decision -->|логи| Logger
    FileMover -->|логи| Logger
    LLMClient -->|HTTP /generate| LLM
    ConfirmUI -->|показ диалога| UISys
```

---

## 4. Workflow / Graph Diagram (состояния и переходы) – Mermaid

```mermaid
flowchart TD
    Start([Файл создан]) --> Queue[Поставить задачу в очередь]
    Queue --> Extract[Извлечь текст/метаданные/код]

    Extract --> CheckExtract{Извлечение успешно?}
    CheckExtract -->|да| IsScript{Файл скрипт?}
    CheckExtract -->|нет| UseFallback[Использовать имя/расширение<br>Низкая уверенность]

    IsScript -->|да| SecurityScan[Статический анализ (AST/regex)<br>Зафиксировать флаги риска]
    IsScript -->|нет| CallLLM

    UseFallback --> CallLLM

    SecurityScan --> CallLLM[Вызвать LLM<br>(если доступна и ж/д >= мин)]

    CallLLM --> LLMCheck{LLM ответила корректно?}
    LLMCheck -->|да| GetResult[Получить категорию, папку, уверенность]
    LLMCheck -->|нет| FallbackRules[Fallback на облегчённый режим<br>Категория по расширению/имени]

    GetResult --> ApplyRules[Применить пользовательские правила]
    FallbackRules --> ApplyRules

    ApplyRules --> NeedConfirm{Скрипт И<br>(риск ИЛИ<br>подтверждение скриптов)?}
    NeedConfirm -->|да| ShowDialog[Показать диалог подтверждения<br>с деталями риска]
    NeedConfirm -->|нет| CheckAuto{Уверенность ≥ порога<br>И авто-перемещение?}

    ShowDialog --> UserConfirm{Пользователь разрешил?}
    UserConfirm -->|да| MoveFile[Переместить файл]
    UserConfirm -->|нет| Skip[Пропустить файл<br>Лог "отказ пользователя"]

    CheckAuto -->|да| MoveFile
    CheckAuto -->|нет| OptionalDialog[Показать диалог подтверждения (опционально)]
    OptionalDialog --> UserConfirm2{Разрешил?}
    UserConfirm2 -->|да| MoveFile
    UserConfirm2 -->|нет| Skip

    MoveFile --> MoveSuccess{Перемещение успешно?}
    MoveSuccess -->|да| LogSuccess[Записать успех<br>Обновить кэш]
    MoveSuccess -->|нет| IsTemporary{Ошибка временная?<br>(Permission, busy)}
    IsTemporary -->|да| Retry[Повторить до 3 раз]
    Retry --> RetrySuccess{Успех?}
    RetrySuccess -->|да| LogSuccess
    RetrySuccess -->|нет| LogError[Записать ошибку<br>Файл остаётся]
    IsTemporary -->|нет| LogError

    LogSuccess --> End([Конец])
    Skip --> End
    LogError --> End
```

---

## 5. Data Flow Diagram (Mermaid)

```mermaid
flowchart LR
    SourceFS[("Файловая система<br>(исходные файлы)")]
    Logs[("Логи (JSONL)")]
    SQLite[("SQLite<br>(кэш, правила)")]
    TargetFS[("Целевая файловая система<br>(организованные файлы)")]

    Watcher(("Watcher"))
    Extractor(("Extractor"))
    Security(("Security Scanner"))
    LLM(("LLM Client"))
    Decision(("Decision Engine"))
    Mover(("File Mover"))

    SourceFS -->|событие (path, timestamp)| Watcher
    Watcher -->|путь к файлу| Extractor
    Extractor -->|чтение содержимого| SourceFS
    Extractor -->|код скрипта| Security
    Security -->|flags (risk, description)| Decision
    Extractor -->|текст/метаданные (≤4k токенов)| LLM
    LLM -->|category, target_folder, confidence| Decision
    SQLite -->|user rules, thresholds| Decision
    Decision -->|команда (src, dst, need_confirm)| Mover
    Mover -->|перемещение файла| TargetFS
    Decision -->|решение, уверенность| Logs
    Mover -->|результат перемещения| Logs
    LLM -->|latency, токены| Logs
    Extractor -->|тип файла, размер| Logs
    Decision -->|кэш (hash → category)| SQLite
```

---

Все диаграммы готовы к использованию в любом Markdown-окружении, поддерживающем Mermaid (GitHub, GitLab, Obsidian, MkDocs с плагином и т.д.). Скопируйте блоки кода в файлы `.md` или прямо в вики проекта.
