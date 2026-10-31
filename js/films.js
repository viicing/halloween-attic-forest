/* =====================================================================
   ТВОИ ФИЛЬМЫ — ЕДИНСТВЕННОЕ МЕСТО, КОТОРОЕ НУЖНО ПРАВИТЬ
   =====================================================================
   Телевизор один на обе сцены: этот список показывается и на чердаке,
   и в лесу. Каждый фильм — один блок { ... }. Скопируй блок, поменяй
   поля, сохрани.

   title  — название
   year   — год (можно не указывать)
   type   — "embed": играть прямо в телевизоре
            "link":  кнопка «Открыть фильм ↗» в новой вкладке
   url    — для embed можно вставить:
              * код для вставки из VK Видео целиком (<iframe src="...">)
                или только адрес из него (https://vkvideo.ru/video_ext.php?...)
              * обычную ссылку YouTube / Rutube / Internet Archive
            для link — любую ссылку (Кинопоиск, Иви, Okko...)
   note   — короткая подпись (необязательно)

   Встраивай только то, что правообладатель разрешил встраивать.
   ===================================================================== */

window.FILMS = [
  {
    title: "Коралина в Стране Кошмаров",
    year: 2009,
    type: "embed",
    url: `<iframe src="https://vkvideo.ru/video_ext.php?oid=-220018529&id=456239502&hash=9a8bcb60454807df&hd=4" width="1920" height="1080" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;" frameborder="0" allowfullscreen></iframe>`,
    note: "VK Видео"
  },
  {
    title: "Тайна Коко",
    year: 2017,
    type: "embed",
    url: `<iframe src="https://vkvideo.ru/video_ext.php?oid=-219105850&id=456241516&hash=f66c299a45f7c936&hd=4" width="1920" height="1080" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;" frameborder="0" allowfullscreen></iframe>`,
    note: "VK Видео"
  },
  {
    // Присланный код для вставки совпадал с «Тайной Коко», поэтому пока
    // здесь ссылка на Кинопоиск. Когда найдёшь правильный код из VK Видео,
    // поменяй type на "embed" и вставь его в url.
    title: "Кошелёк или жизнь",
    year: 2007,
    type: "link",
    url: "https://www.kinopoisk.ru/film/261191/",
    note: "Кинопоиск"
  },
  {
    title: "Ночь живых мертвецов",
    year: 1968,
    type: "embed",
    url: "https://archive.org/details/night_of_the_living_dead",
    note: "Общественное достояние, Internet Archive"
  },
];
