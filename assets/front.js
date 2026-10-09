(() => {
  "use strict";
  const canvas = document.querySelector("#lab-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const start = document.querySelector("#experiment-start");
  const pause = document.querySelector("#experiment-pause");
  const channelButtons = [...document.querySelectorAll("[data-channel]")];
  start.disabled = false;
  channelButtons.forEach((button) => (button.disabled = false));
  const label = document.querySelector("#screen-label");
  const scoreText = document.querySelector("#screen-score");
  const statName = document.querySelector("#screen-stat-name");
  const experimentDescription = document.querySelector(
    "#experiment-description",
  );
  const status = document.querySelector("#experiment-status");
  const W = canvas.width,
    H = canvas.height;
  let channel = "shoot",
    running = false,
    frame = 0,
    last = 0,
    startedAt = 0;
  let elapsed = 0,
    score = 0,
    spawnAt = 0,
    fireAt = 0;
  let player = { x: W / 2, y: H - 80 };
  let enemies = [],
    shots = [];
  const keys = new Set();
  const phrases = [
    "最高www",
    "おもしろい",
    "なんで作った？",
    "すごい！",
    "好き",
  ];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function backdrop() {
    ctx.fillStyle = "#071909";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#254229";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
  function ship(x, y) {
    ctx.fillStyle = "#d4ff66";
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x - 13, y + 12);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x + 13, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f5f5d7";
    ctx.fillRect(x - 3, y - 4, 6, 10);
  }
  function comment(text, x, y) {
    ctx.font = "21px monospace";
    const width = ctx.measureText(text).width + 20;
    ctx.fillStyle = "#163e1a";
    ctx.fillRect(x - width / 2, y - 18, width, 32);
    ctx.strokeStyle = "#72985a";
    ctx.strokeRect(x - width / 2, y - 18, width, 32);
    ctx.fillStyle = "#d1efb6";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y + 6);
    return width;
  }
  function drawShoot() {
    backdrop();
    if (!running && enemies.length === 0) {
      comment("最高www", W * 0.28, H * 0.33);
      comment("なんで作った？", W * 0.68, H * 0.52);
      comment("おもしろい", W * 0.5, H * 0.23);
    }
    for (const e of enemies) comment(e.text, e.x, e.y);
    ctx.fillStyle = "#e6ffab";
    for (const s of shots) ctx.fillRect(s.x - 2, s.y, 4, 13);
    ship(player.x, player.y);
  }
  function drawDiary(t = 0) {
    backdrop();
    ctx.fillStyle = "#e8eccb";
    ctx.font = "43px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("jidori", W / 2, 95);
    const day = Math.min(30, 1 + Math.floor(t * 3));
    scoreText.textContent = String(day).padStart(3, "0");
    const offset = Math.sin(t) * 4;
    for (let i = 0; i < 3; i++) {
      const x = 140 + i * 180;
      ctx.fillStyle = "#d7dec0";
      ctx.fillRect(x - 64, 145, 128, 153);
      ctx.fillStyle = ["#39583c", "#577b45", "#88a35c"][i];
      ctx.fillRect(x - 53, 157, 106, 102);
      ctx.strokeStyle = "#e8efce";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, 190 + offset, 19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, 236, 31, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#274026";
      ctx.font = "13px monospace";
      ctx.fillText(`DAY ${i === 0 ? 1 : i === 1 ? day : day + 30}`, x, 282);
    }
    ctx.fillStyle = "#bed38b";
    ctx.font = "17px monospace";
    ctx.fillText("1日1枚 → 時間をつなぐ", W / 2, 340);
  }
  function render(t = 0) {
    channel === "shoot" ? drawShoot() : drawDiary(t);
  }
  function stop(message) {
    running = false;
    cancelAnimationFrame(frame);
    keys.clear();
    start.textContent = "もう一回";
    pause.disabled = true;
    if (message) status.textContent = message;
    render(elapsed);
  }
  function tick(time) {
    if (!running) return;
    const dt = Math.min((time - last) / 1000, 0.04);
    last = time;
    elapsed = (time - startedAt) / 1000;
    if (channel === "shoot") {
      const speed = 260 * dt;
      if (keys.has("ArrowLeft") || keys.has("a")) player.x -= speed;
      if (keys.has("ArrowRight") || keys.has("d")) player.x += speed;
      player.x = Math.max(35, Math.min(W - 35, player.x));
      if (elapsed >= spawnAt) {
        enemies.push({
          x: 70 + Math.random() * (W - 140),
          y: 75,
          text: phrases[Math.floor(Math.random() * phrases.length)],
        });
        spawnAt = elapsed + 0.7;
      }
      if (elapsed >= fireAt) {
        shots.push({ x: player.x, y: player.y - 18 });
        fireAt = elapsed + 0.17;
      }
      for (const e of enemies) e.y += 55 * dt;
      for (const s of shots) s.y -= 360 * dt;
      for (const s of shots) {
        for (const e of enemies) {
          if (
            !e.hit &&
            !s.hit &&
            Math.abs(s.x - e.x) < 55 &&
            Math.abs(s.y - e.y) < 20
          ) {
            e.hit = true;
            s.hit = true;
            score++;
          }
        }
      }
      enemies = enemies.filter((e) => !e.hit && e.y < H - 45);
      shots = shots.filter((s) => !s.hit && s.y > 45);
      scoreText.textContent = String(score).padStart(3, "0");
    }
    render(elapsed);
    if (elapsed >= 12) {
      stop(
        channel === "shoot"
          ? `実験終了。${score}個のコメントを撃ちました。気になったら、制作事例もどうぞ。`
          : "記録のイメージを再生しました。実際のアプリは紹介ページでご覧ください。",
      );
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  function begin() {
    cancelAnimationFrame(frame);
    running = true;
    elapsed = 0;
    score = 0;
    spawnAt = 0;
    fireAt = 0;
    enemies = [];
    shots = [];
    player = { x: W / 2, y: H - 80 };
    scoreText.textContent = "000";
    start.textContent = "やり直す";
    pause.disabled = false;
    label.textContent =
      channel === "shoot"
        ? "マウス・タッチ・← → で左右に移動。射撃は自動。"
        : "毎日の記録をつなぐ、12秒のイメージ。";
    status.textContent =
      channel === "shoot"
        ? "12秒のミニ実験を開始しました。キャンバスを選択すると、左右キーでも操作できます。"
        : "記録のイメージを再生中です。";
    last = performance.now();
    startedAt = last;
    canvas.focus({ preventScroll: true });
    frame = requestAnimationFrame(tick);
  }
  start.addEventListener("click", begin);
  pause.addEventListener("click", () => {
    if (running) {
      stop("ミニ実験を一時停止しました。もう一回ボタンで再開できます。");
    }
  });
  channelButtons.forEach((button) =>
    button.addEventListener("click", () => {
      stop();
      channel = button.dataset.channel;
      enemies = [];
      shots = [];
      elapsed = 0;
      score = 0;
      scoreText.textContent = "000";
      statName.textContent = channel === "shoot" ? "SCORE" : "DAY";
      experimentDescription.textContent =
        channel === "shoot"
          ? "コメント欄と戦ってみる。"
          : "今日の1枚を、未来へ。";
      canvas.setAttribute(
        "aria-label",
        channel === "shoot"
          ? "コメント弾幕のミニ実験。12秒あそぶボタンで開始し、左右キー、マウス、タッチで左右に移動します。"
          : "jidoriの発想を図解した記録のイメージ。12秒あそぶボタンで再生します。アプリ本体の画面ではありません。",
      );
      channelButtons.forEach((b) =>
        b.setAttribute("aria-pressed", String(b === button)),
      );
      start.textContent = "12秒あそぶ";
      label.textContent =
        channel === "shoot"
          ? "コメントを撃つ、ここだけのミニ実験。"
          : "毎日の記録をつなぐ、アプリの発想を図解。";
      status.textContent =
        channel === "shoot"
          ? "コメント弾幕のチャンネルに切り替えました。"
          : "jidoriのチャンネルに切り替えました。";
      render();
    }),
  );
  canvas.addEventListener("pointermove", (event) => {
    if (!running || channel !== "shoot") return;
    const rect = canvas.getBoundingClientRect();
    player.x = Math.max(
      35,
      Math.min(W - 35, ((event.clientX - rect.left) / rect.width) * W),
    );
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (running && channel === "shoot") {
      const rect = canvas.getBoundingClientRect();
      player.x = Math.max(
        35,
        Math.min(W - 35, ((event.clientX - rect.left) / rect.width) * W),
      );
    }
  });
  canvas.addEventListener("keydown", (event) => {
    if (!running || channel !== "shoot") return;
    if (["ArrowLeft", "ArrowRight", "a", "d"].includes(event.key)) {
      event.preventDefault();
      keys.add(event.key);
    }
    if (event.key === "Escape") stop("ミニ実験を一時停止しました。");
  });
  canvas.addEventListener("keyup", (event) => keys.delete(event.key));
  canvas.addEventListener("blur", () => keys.clear());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) stop("ミニ実験を一時停止しました。");
  });
  if (reduced) document.body.classList.add("motion-paused");
  render();
})();
