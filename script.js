// ===== 設定 =====
const STORAGE_KEY = "coordinate-app-clothes"; // localStorageに保存するときの名前
const MOOD_TAGS = ["メンズライク", "カジュアル", "綺麗め", "海外ガール", "ダル着", "女の子らしい", "韓国っぽ"];

// ===== HTMLの要素を取得 =====
const form = document.getElementById("clothes-form");
const photoInput = document.getElementById("photo");
const preview = document.getElementById("preview");
const categorySelect = document.getElementById("category");
const moodTagsBox = document.getElementById("mood-tags");
const listEl = document.getElementById("clothes-list");
const countEl = document.getElementById("count");

// ===== 雰囲気タグのチェックボックスを作る =====
MOOD_TAGS.forEach((tag) => {
  const label = document.createElement("label");
  label.className = "tag";
  label.innerHTML = `<input type="checkbox" value="${tag}"> ${tag}`;
  moodTagsBox.appendChild(label);
});

// ===== 保存・読み込み =====
function loadClothes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return []; // 読めなかったら空っぽで始める
  }
}

function saveClothes(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    // localStorageは約5MBまでなので、超えるとここに来る
    alert("保存できへんかった…容量オーバーかも");
    return false;
  }
}

let clothes = loadClothes();

// ===== 画像を小さくしてから保存する（容量対策） =====
// スマホの写真はそのままだと数MBあるので、長い辺を400pxに縮める
function resizeImage(file, maxSize = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8)); // 画像を文字列に変換
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== 写真を選んだらプレビュー表示 =====
let resizedPhoto = null;

photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file) return;
  try {
    resizedPhoto = await resizeImage(file);
    preview.src = resizedPhoto;
    preview.hidden = false;
  } catch {
    alert("この画像は読み込めへんかった…別の写真で試してみて");
  }
});

// ===== 登録ボタン =====
form.addEventListener("submit", (e) => {
  e.preventDefault(); // ページの再読み込みを止める

  if (!resizedPhoto) {
    alert("写真を選んでね");
    return;
  }

  // チェックされたタグだけ集める
  const moods = [...moodTagsBox.querySelectorAll("input:checked")].map((c) => c.value);

  // 服1着ぶんのデータ
  const item = {
    id: Date.now().toString(), // 登録時刻をIDにする（かぶらない）
    photo: resizedPhoto,
    category: categorySelect.value,
    moods: moods,
    createdAt: new Date().toISOString(),
  };

  clothes.push(item);
  if (!saveClothes(clothes)) {
    clothes.pop(); // 保存失敗したら取り消す
    return;
  }

  // フォームをリセット
  form.reset();
  resizedPhoto = null;
  preview.hidden = true;
  render();
});

// ===== 一覧を表示 =====
function render() {
  listEl.innerHTML = "";
  countEl.textContent = `（${clothes.length}着）`;

  clothes.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item";
    card.innerHTML = `
      <img src="${item.photo}" alt="${item.category}">
      <p class="cat">${item.category}</p>
      <p class="moods">${item.moods.map((m) => `#${m}`).join(" ")}</p>
      <button class="delete" data-id="${item.id}">削除</button>
    `;
    listEl.appendChild(card);
  });
}

// ===== 削除ボタン =====
listEl.addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  if (!id) return; // 削除ボタン以外がクリックされたら何もしない
  if (!confirm("この服を削除する？")) return;

  clothes = clothes.filter((c) => c.id !== id);
  saveClothes(clothes);
  render();
});

// 最初に一回表示
render();
