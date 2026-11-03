# O‘simlik oilalari jadvali — 6-sinf Botanika

6-sinf Biologiya (Botanika) darsligidagi 47–58-§ mavzulari asosida 12 ta o‘simlik oilasining taqqoslash jadvali.

**Ochish:** 3D modellar ishlashi uchun saytni server orqali oching (masalan, GitHub Pages yoki `python -m http.server`). `index.html` ni to‘g‘ridan-to‘g‘ri ochsangiz, jadval ishlaydi, lekin brauzer 3D modelni yuklamasligi mumkin.

## Jadvaldagi ustunlar
Oila nomi · Oilaga kiruvchi o‘simliklar · Guli, bargi va to‘pguli (+ mevasi) · Rangi yoki uzunligi · Qayerlarda uchraydi · O‘xshash tomonlari · Farqli tomonlari · Vakillari (turlari) soni · Tabobatda qo‘llanilishi

## Imkoniyatlar
- Kompyuter va planshetda — to‘liq jadval (sarlavha va oila nomi qotib turadi)
- Telefonda — har bir oila alohida kartochka, bo‘limlar ochilib-yopiladi
- Qidiruv (oila yoki o‘simlik nomi bo‘yicha), sinf bo‘yicha saralash
- Ikki oilani yonma-yon taqqoslash
- Chop etishga mos
- Har bir oila uchun 3D model: barmoq bilan 360° aylantirish, yaqinlashtirish, tugmalar bilan boshqarish (`models/`, three.js `vendor/` ichida)

## 3D modellar
12 ta o‘simlik `tools/plants.js` da kod bilan qurilgan: barglar tomirli va qirrali, gullar haqiqiy gulbarg soni bilan, mevalar (olma, pomidor, uzum, qovoq, dukkak, ko‘sak) va ildizlar bor. Qayta yasash: serverda `tools/build.html` ni oching. Modellar meshopt bilan siqilgan (jami ~3 MB).

## Ma’lumotlar
Barcha ma’lumotlar `data/families.js` faylida. Manba — darslikning 112–138-betlari. Darslikda yo‘q qo‘shimcha ma’lumot alohida belgilangan.

## Bosqichlar
- [x] 1-bosqich — taqqoslash jadvali
- [x] 2-bosqich — botanik dizayn
- [x] 3-bosqich — 3D modellar (12 ta GLB) va 360° ko‘rish
- [x] 4-bosqich — PWA: telefonga o‘rnatish, internetsiz ishlash (ochilgan 3D modellar ham saqlanadi)
- [x] 5-bosqich — 12 ta modelni tabiiyroq qilib qayta yasash
