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

   Размеры width/height из кода для вставки не важны: плеер всегда
   растягивается на весь экран телевизора, а кнопка полноэкранного
   режима есть в самом плеере.

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
    title: "Кошелёк или жизнь",
    year: 2007,
    type: "embed",
    url: `<iframe width="720" height="405" src="https://rutube.ru/play/embed/4c4cdddd0d19b3dd947e342d9b36f929" style="border: none;" allow="clipboard-write; autoplay" allowFullScreen></iframe>`,
    note: "Rutube"
  },
  {
    title: "Ночь живых мертвецов",
    year: 1968,
    type: "embed",
    url: "https://archive.org/details/night_of_the_living_dead",
    note: "Общественное достояние, Internet Archive"
  },
];
