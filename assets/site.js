(() => {
  "use strict";
  const form = document.querySelector("#brief-form");
  if (!form) return;
  form.querySelector('button[type="submit"]').disabled = false;
  const preview = document.querySelector("#draft-preview");
  const actions = document.querySelector("#draft-actions");
  const mail = document.querySelector("#draft-mail");
  const status = document.querySelector("#draft-status");
  const email = "kyouya510@gmail.com";
  const topic = new URLSearchParams(location.search).get("topic");
  if (["AI活用", "アプリ開発", "Web制作", "その他"].includes(topic))
    form.elements.topic.value = topic;
  let draft = "";
  function invalidate() {
    actions.hidden = true;
    preview.hidden = true;
    status.textContent = "";
    draft = "";
    mail.removeAttribute("href");
  }
  form.addEventListener("input", invalidate);
  form.addEventListener("change", invalidate);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = (key) => String(data.get(key) || "").trim();
    if (!value("message")) {
      form.elements.message.setCustomValidity("相談内容を入力してください。");
      form.elements.message.reportValidity();
      return;
    }
    draft = `USUI LABへの相談\n\n相談の種類：${value("topic")}\nお名前・会社名：${value("name") || "未記入"}\n希望時期：${value("timing") || "未定"}\n予算：${value("budget") || "未定"}\n\n相談内容：\n${value("message")}\n`;
    const subject = `【USUI LABへの相談】${value("topic")}`;
    mail.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`;
    preview.textContent = draft;
    preview.hidden = false;
    actions.hidden = false;
    status.textContent =
      "下書きを作りました。内容を確認し、メールアプリから送信してください。";
  });
  form.elements.message.addEventListener("input", () =>
    form.elements.message.setCustomValidity(""),
  );
  document.querySelector("#copy-draft").addEventListener("click", async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      status.textContent =
        "相談内容をコピーしました。普段使っているメールで kyouya510@gmail.com に送信してください。";
    } catch {
      status.textContent =
        "コピーできませんでした。下書きの文章を選択してコピーし、メールに貼り付けてください。";
    }
  });
})();
